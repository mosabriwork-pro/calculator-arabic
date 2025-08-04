const https = require('https');
const http = require('http');
const dns = require('dns');
const { promisify } = require('util');

const resolve4 = promisify(dns.resolve4);
const resolveCname = promisify(dns.resolveCname);

const domain = 'mosabri.top';
const wwwDomain = 'www.mosabri.top';

async function testDomain(domainName) {
    console.log(`\n🔍 Testing ${domainName}...`);
    
    try {
        // Test DNS resolution
        console.log('📡 Testing DNS resolution...');
        const addresses = await resolve4(domainName);
        console.log(`✅ DNS resolved: ${addresses.join(', ')}`);
        
        // Test HTTPS
        console.log('🔒 Testing HTTPS...');
        await testHTTPS(domainName);
        
        // Test HTTP redirect
        console.log('🔄 Testing HTTP redirect...');
        await testHTTPRedirect(domainName);
        
    } catch (error) {
        console.log(`❌ Error testing ${domainName}: ${error.message}`);
    }
}

function testHTTPS(domainName) {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: domainName,
            port: 443,
            path: '/',
            method: 'GET',
            timeout: 10000
        }, (res) => {
            console.log(`✅ HTTPS Status: ${res.statusCode}`);
            console.log(`✅ HTTPS Headers: ${JSON.stringify(res.headers, null, 2)}`);
            resolve();
        });
        
        req.on('error', (error) => {
            console.log(`❌ HTTPS Error: ${error.message}`);
            reject(error);
        });
        
        req.on('timeout', () => {
            console.log('❌ HTTPS Timeout');
            req.destroy();
            reject(new Error('Timeout'));
        });
        
        req.end();
    });
}

function testHTTPRedirect(domainName) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: domainName,
            port: 80,
            path: '/',
            method: 'GET',
            timeout: 10000
        }, (res) => {
            console.log(`✅ HTTP Status: ${res.statusCode}`);
            if (res.statusCode >= 300 && res.statusCode < 400) {
                console.log(`✅ Redirect detected: ${res.headers.location}`);
            }
            resolve();
        });
        
        req.on('error', (error) => {
            console.log(`❌ HTTP Error: ${error.message}`);
            reject(error);
        });
        
        req.on('timeout', () => {
            console.log('❌ HTTP Timeout');
            req.destroy();
            reject(new Error('Timeout'));
        });
        
        req.end();
    });
}

async function testWWWRedirect() {
    console.log('\n🔄 Testing www redirect...');
    try {
        const cnames = await resolveCname(wwwDomain);
        console.log(`✅ www CNAME: ${cnames.join(', ')}`);
    } catch (error) {
        console.log(`❌ www CNAME error: ${error.message}`);
    }
}

async function runTests() {
    console.log('🚀 Starting domain tests for mosabri.top...');
    
    await testDomain(domain);
    await testDomain(wwwDomain);
    await testWWWRedirect();
    
    console.log('\n✅ Domain testing completed!');
    console.log('\n📋 Summary:');
    console.log('- Check if HTTPS is working');
    console.log('- Check if www redirects to non-www');
    console.log('- Check if SSL certificate is valid');
    console.log('- Check if all pages load correctly');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { testDomain, testHTTPS, testHTTPRedirect }; 