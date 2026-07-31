export class DataFormatter {
  static async formatSpecs(specifications: any): Promise<Array<{label: string, value: string}>> {
    if (!specifications) return [];
    
    const formattedSpecs = [];
    
    // Common product specs
    const specMap: Record<string, string> = {
      'ram': 'RAM',
      'storage': 'Storage',
      'battery': 'Battery',
      'camera': 'Camera',
      'processor': 'Processor',
      'screen': 'Screen Size',
      'display': 'Display',
      'resolution': 'Resolution',
      'operating_system': 'OS',
      'warranty': 'Warranty',
      'delivery': 'Delivery',
      'performance': 'Performance',
      'graphics': 'Graphics',
      'ports': 'Ports',
      'connectivity': 'Connectivity',
      'color': 'Color',
      'material': 'Material',
      'dimensions': 'Dimensions',
      'weight': 'Weight',
      'capacity': 'Capacity',
      'power': 'Power',
      'voltage': 'Voltage',
      'certification': 'Certification',
      'experience': 'Experience',
      'specialty': 'Specialty',
      'availability': 'Availability',
    };
    
    // If specifications is an object, format it
    if (typeof specifications === 'object' && !Array.isArray(specifications)) {
      for (const [key, value] of Object.entries(specifications)) {
        const label = specMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        if (value && typeof value === 'string' && value.length > 0) {
          formattedSpecs.push({ label, value: value.toString() });
        }
      }
    }
    
    // If there are no specs, add default ones
    if (formattedSpecs.length === 0) {
      formattedSpecs.push({ label: 'Type', value: 'Product' });
      formattedSpecs.push({ label: 'Status', value: 'Available' });
    }
    
    return formattedSpecs.slice(0, 6); // Limit to 6 specs
  }
}