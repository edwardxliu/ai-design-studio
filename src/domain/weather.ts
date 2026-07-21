export function describeWeather(code: number) {
  if (code === 0) {
    return "Clear";
  }
  if (code <= 2) {
    return "Partly cloudy";
  }
  if (code === 3) {
    return "Overcast";
  }
  if (code === 45 || code === 48) {
    return "Fog";
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return "Rain";
  }
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return "Snow";
  }
  if (code >= 95) {
    return "Thunderstorm";
  }
  return "Cloudy";
}