from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import dpkt
import socket
import geoip2.database
import os
import ipaddress
import time
import json
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Configuration
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB limit
ALLOWED_EXTENSIONS = {'pcap', 'pcapng'}
UPLOAD_FOLDER = 'uploads'
RESULTS_FOLDER = 'results'

# Create necessary directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)

# Initialize GeoIP2 reader
try:
    gi = geoip2.database.Reader('GeoLite2-City.mmdb')
except Exception as e:
    print(f"Error loading GeoIP database: {e}")
    print("Please ensure you have downloaded the GeoLite2-City.mmdb file")
    print("from https://dev.maxmind.com/geoip/geolite2-free-geolocation-data")

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Helper function to check if an IP address is private
def is_private_ip(ip):
    try:
        ip_obj = ipaddress.ip_address(ip)
        return ip_obj.is_private
    except ValueError:
        return False

def get_protocol_name(protocol_num):
    protocols = {
        1: "ICMP",
        6: "TCP",
        17: "UDP",
        # Add more as needed
    }
    return protocols.get(protocol_num, f"Protocol {protocol_num}")

def process_pcap(file_path):
    """Process a PCAP file and extract network connection data."""
    kml_points = ''
    stats = {
        'total_packets': 0,
        'protocols': {},
        'public_connections': 0,
        'private_to_public': 0,
        'public_to_private': 0,
        'connections': [],
        'top_sources': {},
        'top_destinations': {}
    }
    
    try:
        with open(file_path, 'rb') as f:
            pcap = dpkt.pcap.Reader(f)
            for ts, buf in pcap:
                stats['total_packets'] += 1
                
                try:
                    # Parse Ethernet frame
                    eth = dpkt.ethernet.Ethernet(buf)
                    
                    # Skip non-IP packets
                    if not isinstance(eth.data, dpkt.ip.IP):
                        continue
                        
                    ip = eth.data
                    src = socket.inet_ntoa(ip.src)
                    dst = socket.inet_ntoa(ip.dst)
                    
                    # Record protocol statistics
                    protocol = get_protocol_name(ip.p)
                    stats['protocols'][protocol] = stats['protocols'].get(protocol, 0) + 1
                    
                    # Count top sources and destinations
                    stats['top_sources'][src] = stats['top_sources'].get(src, 0) + 1
                    stats['top_destinations'][dst] = stats['top_destinations'].get(dst, 0) + 1
                    
                    # Skip if both source and destination are private IPs
                    if is_private_ip(src) and is_private_ip(dst):
                        continue
                    
                    # Record timestamp in human-readable format
                    timestamp = datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')
                    
                    # Generate KML based on connection type
                    if is_private_ip(src) and not is_private_ip(dst):
                        # Private to public connection
                        kml_points += generate_kml(src, dst, protocol, "private_to_public")
                        stats['private_to_public'] += 1
                        stats['connections'].append({
                            'type': 'private_to_public',
                            'src': src,
                            'dst': dst,
                            'protocol': protocol,
                            'timestamp': timestamp
                        })
                    elif is_private_ip(dst) and not is_private_ip(src):
                        # Public to private connection
                        kml_points += generate_kml(src, dst, protocol, "public_to_private")
                        stats['public_to_private'] += 1
                        stats['connections'].append({
                            'type': 'public_to_private',
                            'src': src,
                            'dst': dst,
                            'protocol': protocol,
                            'timestamp': timestamp
                        })
                    elif not is_private_ip(src) and not is_private_ip(dst):
                        # Public to public connection
                        kml_points += generate_kml(src, dst, protocol, "public_to_public")
                        stats['public_connections'] += 1
                        stats['connections'].append({
                            'type': 'public_to_public',
                            'src': src,
                            'dst': dst,
                            'protocol': protocol,
                            'timestamp': timestamp
                        })
                except Exception as e:
                    print(f"Error processing packet {stats['total_packets']}: {e}")
                    continue
    except Exception as e:
        print(f"Error opening PCAP file: {e}")
        return None, {"error": str(e)}
    
    # Sort and limit top sources and destinations to top 10
    stats['top_sources'] = dict(sorted(stats['top_sources'].items(), key=lambda x: x[1], reverse=True)[:10])
    stats['top_destinations'] = dict(sorted(stats['top_destinations'].items(), key=lambda x: x[1], reverse=True)[:10])
    
    # Create complete KML document
    kml_document = generate_kml_document(kml_points)
    
    return kml_document, stats

def generate_kml_document(kml_content):
    """Generate a complete KML document with styles."""
    styles = '''
    <Style id="private_to_public">
        <LineStyle>
            <color>ff00ff00</color>
            <width>2</width>
        </LineStyle>
        <IconStyle>
            <Icon>
                <href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href>
            </Icon>
        </IconStyle>
    </Style>
    <Style id="public_to_private">
        <LineStyle>
            <color>ff0000ff</color>
            <width>2</width>
        </LineStyle>
        <IconStyle>
            <Icon>
                <href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href>
            </Icon>
        </IconStyle>
    </Style>
    <Style id="public_to_public">
        <LineStyle>
            <color>ffff0000</color>
            <width>2</width>
        </LineStyle>
        <IconStyle>
            <Icon>
                <href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href>
            </Icon>
        </IconStyle>
    </Style>
    '''
    
    kml = f'''<?xml version="1.0" encoding="UTF-8"?>
    <kml xmlns="http://www.opengis.net/kml/2.2">
    <Document>
    <name>Network Traffic Analysis</name>
    <description>Visualization of network traffic from PCAP analysis</description>
    {styles}
    {kml_content}
    </Document>
    </kml>'''
    
    return kml

def generate_kml(src_ip, dst_ip, protocol, connection_type):
    """Generate KML for a connection between source and destination IPs."""
    try:
        # Get source coordinates
        src_coords = "0,0,0"  # Default for private IPs
        src_name = src_ip
        if not is_private_ip(src_ip):
            try:
                src_location = gi.city(src_ip)
                if src_location and src_location.location and src_location.location.longitude and src_location.location.latitude:
                    src_coords = f"{src_location.location.longitude},{src_location.location.latitude},0"
                    src_name = f"{src_ip} ({src_location.city.name}, {src_location.country.name})"
            except Exception as e:
                print(f"Error getting location for source IP {src_ip}: {e}")
        
        # Get destination coordinates
        dst_coords = "0,0,0"  # Default for private IPs
        dst_name = dst_ip
        if not is_private_ip(dst_ip):
            try:
                dst_location = gi.city(dst_ip)
                if dst_location and dst_location.location and dst_location.location.longitude and dst_location.location.latitude:
                    dst_coords = f"{dst_location.location.longitude},{dst_location.location.latitude},0"
                    dst_name = f"{dst_ip} ({dst_location.city.name}, {dst_location.country.name})"
            except Exception as e:
                print(f"Error getting location for destination IP {dst_ip}: {e}")
        
        # Skip if both coordinates are default (0,0,0)
        if src_coords == "0,0,0" and dst_coords == "0,0,0":
            return ""
        
        # Create a placemark for the connection
        placemark = f'''
        <Placemark>
            <name>{src_name} → {dst_name}</name>
            <description>Protocol: {protocol}</description>
            <styleUrl>#{connection_type}</styleUrl>
            <LineString>
                <extrude>1</extrude>
                <tessellate>1</tessellate>
                <altitudeMode>relativeToGround</altitudeMode>
                <coordinates>
                    {src_coords}
                    {dst_coords}
                </coordinates>
            </LineString>
        </Placemark>
        '''
        return placemark
    
    except Exception as e:
        print(f"Error generating KML for {src_ip} to {dst_ip}: {e}")
        return ""

@app.route('/upload', methods=['POST'])
def upload_file():
    # Check if file is in request
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    
    # Check if filename is empty
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    # Check file extension
    if not allowed_file(file.filename):
        return jsonify({"error": f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"}), 400
    
    # Generate unique filename
    timestamp = int(time.time())
    filename = f"pcap_{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    
    # Save the file temporarily
    file.save(file_path)
    
    # Check file size
    file_size = os.path.getsize(file_path)
    if file_size > MAX_FILE_SIZE:
        os.remove(file_path)  # Clean up
        return jsonify({"error": f"File too large. Maximum size: {MAX_FILE_SIZE/1024/1024:.1f}MB"}), 400
    
    # Process the PCAP file
    kml_data, stats = process_pcap(file_path)
    
    # Clean up the uploaded file
    os.remove(file_path)
    
    if not kml_data:
        return jsonify({"error": "Failed to process PCAP file", "details": stats.get("error", "Unknown error")}), 500
    
    # Save KML and stats data
    result_id = f"result_{timestamp}"
    kml_filename = f"{result_id}.kml"
    stats_filename = f"{result_id}.json"
    
    kml_path = os.path.join(RESULTS_FOLDER, kml_filename)
    stats_path = os.path.join(RESULTS_FOLDER, stats_filename)
    
    with open(kml_path, 'w') as f:
        f.write(kml_data)
    
    with open(stats_path, 'w') as f:
        json.dump(stats, f)
    
    # Return URLs for the KML and stats files
    return jsonify({
        "kml_url": f"/results/{kml_filename}",
        "stats_url": f"/results/{stats_filename}",
        "result_id": result_id,
        "summary": {
            "total_packets": stats['total_packets'],
            "public_connections": stats['public_connections'],
            "private_to_public": stats['private_to_public'],
            "public_to_private": stats['public_to_private']
        }
    })

@app.route('/results/<filename>')
def serve_result(filename):
    return send_from_directory(RESULTS_FOLDER, filename)

@app.route('/health')
def health_check():
    return jsonify({"status": "ok", "timestamp": time.time()})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))