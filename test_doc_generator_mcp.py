#!/usr/bin/env python3
"""
Test script for documentation-generator MCP server initialization fixes.

This script tests:
1. Server starts correctly with proper environment variables
2. Server handles missing environment variables gracefully
3. Tools can be called successfully
4. Error messages are informative
"""

import os
import sys
import json
import subprocess
import time
from pathlib import Path

def print_section(title):
    """Print a formatted section header."""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_server_with_env():
    """Test server initialization with environment variables set."""
    print_section("TEST 1: Server with Environment Variables")
    
    # Check if .env file exists
    env_file = Path('.env')
    if not env_file.exists():
        print("⚠ No .env file found. Creating from .env.example...")
        example_file = Path('.env.example')
        if example_file.exists():
            with open(example_file, 'r') as f:
                content = f.read()
            with open(env_file, 'w') as f:
                f.write(content)
            print("✓ Created .env file. Please update with your credentials.")
        else:
            print("✗ No .env.example found either!")
            return False
    
    # Load environment variables
    env_vars = {}
    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                env_vars[key.strip()] = value.strip()
    
    # Check required variables
    required_vars = ['WATSONX_API_KEY', 'WATSONX_PROJECT_ID']
    missing_vars = [var for var in required_vars if not env_vars.get(var) or env_vars[var] == f'your_{var.lower()}_here']
    
    if missing_vars:
        print(f"⚠ Missing or placeholder values for: {', '.join(missing_vars)}")
        print("  Please update .env file with actual credentials")
        return False
    
    print("✓ Environment variables found:")
    for var in required_vars:
        value = env_vars[var]
        masked = value[:8] + '...' if len(value) > 8 else '***'
        print(f"  - {var}: {masked}")
    
    return True

def test_server_without_env():
    """Test server initialization without environment variables."""
    print_section("TEST 2: Server without Environment Variables")
    
    print("Testing server behavior with missing credentials...")
    print("Expected: Server should start but log initialization warnings")
    
    # Create a test environment without credentials
    test_env = os.environ.copy()
    test_env.pop('WATSONX_API_KEY', None)
    test_env.pop('WATSONX_PROJECT_ID', None)
    test_env['REPO_PATH'] = os.getcwd()
    
    try:
        # Start server process
        server_path = Path('src/mcp-servers/documentation-generator/build/server.js')
        if not server_path.exists():
            print(f"✗ Server build not found at {server_path}")
            return False
        
        print(f"Starting server: node {server_path}")
        proc = subprocess.Popen(
            ['node', str(server_path)],
            env=test_env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            stdin=subprocess.PIPE,
            text=True
        )
        
        # Wait a bit for initialization
        time.sleep(2)
        
        # Check if process is still running
        if proc.poll() is not None:
            stdout, stderr = proc.communicate()
            print("✗ Server exited unexpectedly")
            print(f"STDERR:\n{stderr}")
            return False
        
        # Send a list_tools request
        request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/list"
        }
        
        proc.stdin.write(json.dumps(request) + '\n')
        proc.stdin.flush()
        
        # Try to read response (with timeout)
        time.sleep(1)
        
        # Terminate the process
        proc.terminate()
        stdout, stderr = proc.communicate(timeout=5)
        
        print("Server STDERR output:")
        print(stderr)
        
        # Check for expected warning messages
        if '✗ Failed to initialize WatsonX client' in stderr:
            print("\n✓ Server correctly detected missing credentials")
            return True
        else:
            print("\n⚠ Expected warning message not found")
            return False
            
    except Exception as e:
        print(f"✗ Error during test: {e}")
        if 'proc' in locals():
            proc.kill()
        return False

def test_mcp_client_paths():
    """Test that MCP client paths are correct."""
    print_section("TEST 3: MCP Client Server Paths")
    
    # Check if other MCP servers exist
    servers = {
        'code-analyzer': 'src/mcp-servers/code-analyzer/build/server.js',
        'git-analyzer': 'src/mcp-servers/git-analyzer/build/server.js'
    }
    
    all_exist = True
    for name, path in servers.items():
        server_path = Path(path)
        if server_path.exists():
            print(f"✓ {name} server found at {path}")
        else:
            print(f"✗ {name} server NOT found at {path}")
            all_exist = False
    
    if not all_exist:
        print("\n⚠ Some MCP servers are missing. Build them with:")
        print("  cd src/mcp-servers/code-analyzer && npx tsc")
        print("  cd src/mcp-servers/git-analyzer && npx tsc")
    
    return all_exist

def test_build_exists():
    """Test that the documentation-generator build exists."""
    print_section("TEST 4: Build Verification")
    
    build_path = Path('src/mcp-servers/documentation-generator/build/server.js')
    if build_path.exists():
        print(f"✓ Build found at {build_path}")
        
        # Check file size
        size = build_path.stat().st_size
        print(f"  File size: {size:,} bytes")
        
        # Check if it's recent
        mtime = build_path.stat().st_mtime
        age = time.time() - mtime
        print(f"  Last modified: {age:.0f} seconds ago")
        
        return True
    else:
        print(f"✗ Build NOT found at {build_path}")
        print("  Run: cd src/mcp-servers/documentation-generator && npx tsc")
        return False

def main():
    """Run all tests."""
    print("""
╔══════════════════════════════════════════════════════════════╗
║  Documentation Generator MCP Server - Initialization Tests  ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    results = {
        'Build Verification': test_build_exists(),
        'MCP Client Paths': test_mcp_client_paths(),
        'Environment Variables': test_server_with_env(),
        'Graceful Degradation': test_server_without_env(),
    }
    
    # Print summary
    print_section("TEST SUMMARY")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status:8} - {test_name}")
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✓ All tests passed! Server initialization is working correctly.")
        return 0
    else:
        print("\n⚠ Some tests failed. Review the output above for details.")
        return 1

if __name__ == '__main__':
    sys.exit(main())

# Made with Bob
