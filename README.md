```json
{
  title: "Yr.no JSON/CORS Proxy",
  about: "Weather forecast from yr.no, delivered by the Norwegian Meteorological Institute and the NRK",
  author: "Torstein Bjørnstad",
  github: "https://github.com/toshb/yr-proxy",
  usage: [
    {
      type: "place search",
      example: "http://localhost:3000/search?q=tavang&pri=40",
      usage: "Free-text search, optional priority filter. Lower pri, bigger place."
    },
    {
      type: "weather lookup",
      example: "http://localhost:3000/sted/Norge/Oslo/Oslo/Oslo/varsel.json",
      usage: "Looks up weather on yr.no, converts to json, adds cors headers. 10 min cache."
    }
  ]
}
```
