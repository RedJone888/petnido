export async function getBrowserLocation(): Promise<{
  lat: number;
  lon: number;
}> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      reject,
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
}
export async function getIPLocation(): Promise<{
  lat: number;
  lon: number;
} | null> {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    return {
      lat: data.latitude,
      lon: data.longitude,
    };
  } catch (e) {
    return null;
  }
}
