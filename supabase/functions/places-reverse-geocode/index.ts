// supabase/functions/places-reverse-geocode/index.ts

// Supabase runs this function in Deno, but the Deno global may not be included
// in the editor's TypeScript environment.
declare const Deno: {
  serve: (
    handler: (req: Request) => Response | Promise<Response>,
  ) => void;
};

Deno.serve(async (req: Request) => {
  try {
    // Handle CORS
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers, status: 204 });
    }

    const url = new URL(req.url);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");

    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ error: "Missing lat or lng parameters" }),
        { headers: { ...headers, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`📍 Fetching address from OpenStreetMap for: ${lat}, ${lng}`);

    // ✅ Use free OpenStreetMap Nominatim API
    const nominatimUrl = 
      `https://nominatim.openstreetmap.org/reverse` +
      `?lat=${lat}&lon=${lng}` +
      `&format=json` +
      `&addressdetails=1` +
      `&zoom=18`;

    const response = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "Munolink-App/1.0", // ✅ Required by Nominatim
        "Accept": "application/json",
      },
    });

    const data = await response.json();

    console.log("OpenStreetMap response:", data);

    // ✅ Check if we got results
    if (data.error) {
      console.error("Nominatim error:", data.error);
      
      // If no address found, return coordinates as fallback
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const latDir = latNum >= 0 ? 'N' : 'S';
      const lngDir = lngNum >= 0 ? 'E' : 'W';
      const latStr = Math.abs(latNum).toFixed(4);
      const lngStr = Math.abs(lngNum).toFixed(4);
      const coordsString = `${latStr}° ${latDir}, ${lngStr}° ${lngDir}`;

      return new Response(
        JSON.stringify({
          success: false,
          error: "No address found for these coordinates",
          fallback: {
            formatted_address: `Location at ${coordsString}`,
            coordinates: { lat: latNum, lng: lngNum },
            display: coordsString
          }
        }),
        { headers: { ...headers, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // ✅ Parse address components from OpenStreetMap
    const address = data.address || {};
    
    // Extract address components
    const city = address.city || address.town || address.village || address.hamlet || address.suburb || null;
    const region = address.state || address.region || address.county || address.province || null;
    const country = address.country || null;
    const street = address.road || address.street || address.pedestrian || null;
    const streetNumber = address.house_number || null;
    const district = address.suburb || address.neighbourhood || address.quarter || null;
    const postalCode = address.postcode || null;
    const houseName = address.building || address.amenity || null;

    // ✅ Build a clean formatted address
    let formattedAddress = data.display_name || null;
    
    // If display_name is too long or we want a cleaner version
    if (formattedAddress && formattedAddress.length > 100) {
      const parts = [];
      if (street) parts.push(street);
      if (streetNumber) parts[parts.length - 1] += ` ${streetNumber}`;
      if (city && city !== street) parts.push(city);
      if (region && region !== city) parts.push(region);
      if (country && country !== region) parts.push(country);
      if (parts.length > 0) {
        formattedAddress = parts.join(', ');
      }
    }

    // If no address components found, use the display_name or fallback
    if (!formattedAddress && data.display_name) {
      formattedAddress = data.display_name;
    }

    if (!formattedAddress) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const latDir = latNum >= 0 ? 'N' : 'S';
      const lngDir = lngNum >= 0 ? 'E' : 'W';
      const latStr = Math.abs(latNum).toFixed(4);
      const lngStr = Math.abs(lngNum).toFixed(4);
      formattedAddress = `${latStr}° ${latDir}, ${lngStr}° ${lngDir}`;
    }

    // ✅ Return the address
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          formatted_address: formattedAddress,
          place_id: data.place_id || data.osm_id ? `${data.osm_type}/${data.osm_id}` : null,
          city: city,
          region: region,
          country: country,
          street: street,
          street_number: streetNumber,
          district: district,
          postal_code: postalCode,
          house_name: houseName,
          lat: data.lat || lat,
          lon: data.lon || lng,
          display_name: data.display_name || null,
          class: data.class || null,
          type: data.type || null,
          importance: data.importance || null,
        },
        source: "openstreetmap"
      }),
      { headers: { ...headers, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error in places-reverse-geocode:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      }),
      { 
        headers: { 
          "Access-Control-Allow-Origin": "*", 
          "Content-Type": "application/json" 
        }, 
        status: 500 
      }
    );
  }
});