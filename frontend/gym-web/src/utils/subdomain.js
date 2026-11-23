export const getSubdomain = () => {
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return localStorage.getItem("lastGymSubdomain") || null;
  }
  const parts = hostname.split(".");
  if (
    parts.length > 2 &&
    !["www", "app", "gymzora"].includes(parts[0].toLowerCase())
  ) {
    return parts[0];
  }
  return null;
};
