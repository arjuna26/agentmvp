// List of curated high‑traffic locations in major U.S. national parks.
//
// Each object includes a human‑readable name along with latitude and
// longitude coordinates rounded to ~4 decimal places. These coordinates
// correspond to trailheads, visitor centers or popular viewpoints where
// hikers, campers and other outdoor enthusiasts frequently gather.  See
// the citations in the project notes for the sources of these values.

const locations = [
  {
    id: 'old-faithful',
    name: 'Old Faithful (Yellowstone)',
    lat: 44.4605, // 44°27′38″N
    lon: -110.8282, // 110°49′41″W
  },
  {
    id: 'yosemite-valley',
    name: 'Yosemite Valley Visitor Center (Yosemite)',
    lat: 37.7433,
    lon: -119.5760,
  },
  {
    id: 'mather-point',
    name: 'Mather Point (Grand Canyon)',
    lat: 36.0610,
    lon: -112.1080,
  },
  {
    id: 'angels-landing',
    name: 'Angels Landing (Zion)',
    lat: 37.2694,
    lon: -112.9481,
  },
  {
    id: 'clingmans-dome',
    name: 'Clingmans Dome (Great Smoky Mountains)',
    lat: 35.5628,
    lon: -83.4986,
  },
  {
    id: 'paradise',
    name: 'Paradise Visitor Center (Mount Rainier)',
    lat: 46.7867,
    lon: -121.7345,
  },

  // Additional high‑traffic points added for broader coverage across the U.S.
  {
    id: 'denali-entrance',
    name: 'Denali Park Entrance (Alaska)',
    // The National Park Service recommends using these coordinates to reach the
    // park entrance by GPS【407334633547973†L665-L666】.
    lat: 63.7284,
    lon: -148.8866,
  },
  {
    id: 'logan-pass',
    name: 'Logan Pass (Glacier)',
    // Logan Pass sits along the Continental Divide in Glacier National Park【769713340753922†L16-L21】.
    lat: 48.6913,
    lon: -113.7176,
  },
  {
    id: 'cadillac-mountain',
    name: 'Cadillac Mountain (Acadia)',
    // Peakbagger lists the summit’s coordinates in decimal degrees【69930721614277†L14-L19】.
    lat: 44.3513,
    lon: -68.2266,
  },
  {
    id: 'coe-visitor-center',
    name: 'Ernest F. Coe Visitor Center (Everglades)',
    // The Everglades visitor center description provides approximate GPS coordinates【931745546085932†L139-L145】.
    lat: 25.3953,
    lon: -80.5832,
  },
  {
    id: 'delicate-arch',
    name: 'Delicate Arch Trailhead (Arches)',
    // VisitUtah lists the GPS coordinates for the Delicate Arch trailhead【538133881469325†L115-L119】.
    lat: 38.7340,
    lon: -109.5013,
  },
];

export default locations;