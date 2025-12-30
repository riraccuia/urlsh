class IPMatcher {
  constructor(allowedIPs) {
    this.rules = this._createRules(allowedIPs);
  }

  _createRules(allowedIPs) {
    const rules = { exact: new Set(), cidr: [] };
    if (!allowedIPs) {
      return rules;
    }
    allowedIPs.split(',').forEach(entry => {
      const trimmed = entry.trim();
      if (trimmed.includes('/')) {
        rules.cidr.push(trimmed);
        return;
      }
      rules.exact.add(trimmed);
    });
    return rules;
  }

  static ipv4ToInt(ip) {
    // Split IPv4 address into octets (e.g., "192.168.1.1" -> ["192", "168", "1", "1"])
    const b = ip.split('.').map(octet => parseInt(octet, 10));
    
    // Combine octets into 32-bit integer using bitwise OR:
    //   b[0] << 24: First octet (leftmost) shifted to most significant byte
    //   b[1] << 16: Second octet shifted to second most significant byte
    //   b[2] << 8:  Third octet shifted to second least significant byte
    //   b[3]:       Fourth octet (rightmost) in least significant byte
    // Example: 192.168.1.1
    //   192 << 24 = 3221225472
    //   168 << 16 = 11010048
    //   1 << 8 = 256
    //   1 = 1
    //   Combined: 3221225472 | 11010048 | 256 | 1 = 3232235777
    // Convert to unsigned 32-bit integer (>>> 0 ensures unsigned representation)
    return (b[3] | (b[2] << 8) | (b[1] << 16) | (b[0] << 24)) >>> 0;
  }

  static ipv6ToBigInt(ip) {
    // Split IPv6 address on ':' to get segments
    // Note: '::' creates an empty string in the array (e.g., "2001:db8::1" -> ["2001", "db8", "", "1"])
    const parts = ip.split(':');
    
    // Expand to exactly 8 segments by inserting zeros where needed
    // If empty string found (from '::' compression), replace it with zeros
    // Otherwise, pad with zeros at the end if we have fewer than 8 segments
    const emptyIndex = parts.indexOf('');
    let b = parts;
    
    if (emptyIndex !== -1) {
      // Remove empty string and insert zeros to fill up to 8 segments
      const before = parts.slice(0, emptyIndex);
      const after = parts.slice(emptyIndex + 1);
      const missing = 8 - before.length - after.length;
      b = [...before, ...Array(missing).fill('0'), ...after];
    }
    
    // Pad with zeros at the end if we still have fewer than 8 segments
    if (b.length < 8) {
      b = [...b, ...Array(8 - b.length).fill('0')];
    }
    
    // Convert each 16-bit segment to BigInt
    // IPv6 has 8 segments of 16 bits each (128 bits total)
    const segments = b.map(part => BigInt('0x' + (part || '0').padStart(4, '0')));
    
    // Combine segments into 128-bit integer using bitwise OR:
    //   segments[0] << 112: First segment (leftmost) shifted to most significant bits
    //   segments[1] << 96:  Second segment
    //   segments[2] << 80:  Third segment
    //   segments[3] << 64:  Fourth segment
    //   segments[4] << 48:  Fifth segment
    //   segments[5] << 32:  Sixth segment
    //   segments[6] << 16:  Seventh segment
    //   segments[7]:        Eighth segment (rightmost) in least significant bits
    return segments[7] | (segments[6] << 16n) | (segments[5] << 32n) | (segments[4] << 48n) |
           (segments[3] << 64n) | (segments[2] << 80n) | (segments[1] << 96n) | (segments[0] << 112n);
  }

  static isIPv4(ip) {
    return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
  }

  static isIPv6(ip) {
    return ip.includes(':');
  }

  static ipInCIDR(ip, cidr) {
    const [range, prefixLen] = cidr.split('/');
    const prefix = parseInt(prefixLen, 10);
    
    if (IPMatcher.isIPv4(ip) && IPMatcher.isIPv4(range)) {
      const mask = (0xFFFFFFFF << (32 - prefix)) >>> 0;
      return (IPMatcher.ipv4ToInt(ip) & mask) === (IPMatcher.ipv4ToInt(range) & mask);
    }
    
    if (!IPMatcher.isIPv6(ip) || !IPMatcher.isIPv6(range)) {
      return false;
    }

    const mask = (-1n << BigInt(128 - prefix));
    return (IPMatcher.ipv6ToBigInt(ip) & mask) === (IPMatcher.ipv6ToBigInt(range) & mask);
  }

  isAllowed(ip) {
    if (this.rules.exact.has(ip)) return true;
    return this.rules.cidr.some(cidr => IPMatcher.ipInCIDR(ip, cidr));
  }
}

export { IPMatcher };

