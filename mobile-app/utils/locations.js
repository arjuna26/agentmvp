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
];

export default locations;