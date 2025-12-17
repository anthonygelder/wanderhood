import type { 
  City, 
  Neighborhood, 
  Hotel, 
  QuestionnaireInput, 
  Recommendation,
  Favorite,
  InsertFavorite
} from "@shared/schema";
import { favorites } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getCities(): Promise<City[]>;
  getCityBySlug(slug: string): Promise<City | undefined>;
  getCityById(id: string): Promise<City | undefined>;
  getNeighborhoodsByCityId(cityId: string): Promise<Neighborhood[]>;
  getNeighborhoodsByCitySlug(slug: string): Promise<Neighborhood[]>;
  getNeighborhoodById(id: string): Promise<Neighborhood | undefined>;
  getHotelsByNeighborhoodId(neighborhoodId: string): Promise<Hotel[]>;
  getRecommendations(input: QuestionnaireInput): Promise<Recommendation[]>;
  updateNeighborhoodDescription(id: string, description: string): Promise<void>;
  
  // Favorites operations (userId is string for Replit Auth)
  getFavoritesByUserId(userId: string): Promise<Favorite[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, neighborhoodId: string): Promise<void>;
  isFavorite(userId: string, neighborhoodId: string): Promise<boolean>;
}

const cities: City[] = [
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    slug: "tokyo",
    description: "A sprawling metropolis with one of the world's best public transit systems. Navigate easily without a car through efficient trains, metros, and walkable neighborhoods.",
    heroImage: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
    coordinates: { lat: 35.6762, lng: 139.6503 },
    timezone: "Asia/Tokyo",
  },
  {
    id: "lisbon",
    name: "Lisbon",
    country: "Portugal",
    slug: "lisbon",
    description: "Historic European capital with charming trams, walkable hills, and vibrant neighborhoods. Perfect for exploring on foot with excellent metro connections.",
    heroImage: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&q=80",
    coordinates: { lat: 38.7223, lng: -9.1393 },
    timezone: "Europe/Lisbon",
  },
  {
    id: "mexico-city",
    name: "Mexico City",
    country: "Mexico",
    slug: "mexico-city",
    description: "A vibrant megacity with extensive metro network and walkable colonial neighborhoods. Rich culture, incredible food, and car-free zones in key areas.",
    heroImage: "https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=800&q=80",
    coordinates: { lat: 19.4326, lng: -99.1332 },
    timezone: "America/Mexico_City",
  },
  {
    id: "barcelona",
    name: "Barcelona",
    country: "Spain",
    slug: "barcelona",
    description: "Mediterranean gem with superblocks reducing car traffic, excellent metro, and beach-side walkability. Architecture and food at every corner.",
    heroImage: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80",
    coordinates: { lat: 41.3851, lng: 2.1734 },
    timezone: "Europe/Madrid",
  },
  {
    id: "amsterdam",
    name: "Amsterdam",
    country: "Netherlands",
    slug: "amsterdam",
    description: "The cycling capital of the world with excellent tram network and compact, walkable neighborhoods. Cars are almost unnecessary here.",
    heroImage: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80",
    coordinates: { lat: 52.3676, lng: 4.9041 },
    timezone: "Europe/Amsterdam",
  },
  {
    id: "singapore",
    name: "Singapore",
    country: "Singapore",
    slug: "singapore",
    description: "Ultra-modern city-state with world-class MRT system, covered walkways, and air-conditioned malls connecting neighborhoods.",
    heroImage: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80",
    coordinates: { lat: 1.3521, lng: 103.8198 },
    timezone: "Asia/Singapore",
  },
];

const neighborhoods: Neighborhood[] = [
  // Tokyo neighborhoods
  {
    id: "shibuya",
    cityId: "tokyo",
    name: "Shibuya",
    slug: "shibuya",
    description: "Iconic crossing, youth culture hub, and fashion center with excellent rail connections.",
    heroImage: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&q=80",
    vibe: ["hip", "party", "foodie"],
    scores: {
      walkability: 92,
      transitConnectivity: 98,
      safety: 88,
      foodCoffeeDensity: 95,
      nightlife: 94,
      touristFriendliness: 90,
      localVibes: 75,
    },
    highlights: ["Shibuya Crossing", "Hachiko Statue", "Center Gai"],
    transitHubs: ["Shibuya Station", "JR Lines", "Metro Lines"],
    priceLevel: "upscale",
    coordinates: { lat: 35.6580, lng: 139.7016 },
    boundaryCoordinates: [[139.69, 35.65], [139.71, 35.65], [139.71, 35.67], [139.69, 35.67]],
  },
  {
    id: "shimokitazawa",
    cityId: "tokyo",
    name: "Shimokitazawa",
    slug: "shimokitazawa",
    description: "Bohemian neighborhood loved by artists, vintage shoppers, and live music fans.",
    heroImage: "https://images.unsplash.com/photo-1551641506-ee5bf4cb45f1?w=800&q=80",
    vibe: ["artsy", "hip", "quiet"],
    scores: {
      walkability: 88,
      transitConnectivity: 82,
      safety: 92,
      foodCoffeeDensity: 85,
      nightlife: 78,
      touristFriendliness: 70,
      localVibes: 95,
    },
    highlights: ["Vintage Shops", "Live Music Venues", "Independent Cafes"],
    transitHubs: ["Shimokitazawa Station", "Odakyu Line", "Keio Line"],
    priceLevel: "moderate",
    coordinates: { lat: 35.6613, lng: 139.6680 },
    boundaryCoordinates: [[139.66, 35.65], [139.68, 35.65], [139.68, 35.67], [139.66, 35.67]],
  },
  {
    id: "asakusa",
    cityId: "tokyo",
    name: "Asakusa",
    slug: "asakusa",
    description: "Traditional Tokyo with ancient temples, old shopping streets, and authentic atmosphere.",
    heroImage: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80",
    vibe: ["historic", "quiet", "foodie"],
    scores: {
      walkability: 90,
      transitConnectivity: 85,
      safety: 94,
      foodCoffeeDensity: 82,
      nightlife: 55,
      touristFriendliness: 95,
      localVibes: 80,
    },
    highlights: ["Senso-ji Temple", "Nakamise Street", "Sumida River"],
    transitHubs: ["Asakusa Station", "Ginza Line", "Asakusa Line"],
    priceLevel: "moderate",
    coordinates: { lat: 35.7147, lng: 139.7967 },
    boundaryCoordinates: [[139.79, 35.71], [139.81, 35.71], [139.81, 35.73], [139.79, 35.73]],
  },
  // Lisbon neighborhoods
  {
    id: "alfama",
    cityId: "lisbon",
    name: "Alfama",
    slug: "alfama",
    description: "Oldest neighborhood with narrow cobblestone streets, Fado music, and stunning views.",
    heroImage: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80",
    vibe: ["historic", "artsy", "quiet"],
    scores: {
      walkability: 75,
      transitConnectivity: 70,
      safety: 82,
      foodCoffeeDensity: 80,
      nightlife: 65,
      touristFriendliness: 88,
      localVibes: 85,
    },
    highlights: ["Castelo de Sao Jorge", "Fado Houses", "Miradouros"],
    transitHubs: ["Tram 28", "Santa Apolonia Station"],
    priceLevel: "moderate",
    coordinates: { lat: 38.7139, lng: -9.1303 },
    boundaryCoordinates: [[-9.14, 38.71], [-9.12, 38.71], [-9.12, 38.72], [-9.14, 38.72]],
  },
  {
    id: "bairro-alto",
    cityId: "lisbon",
    name: "Bairro Alto",
    slug: "bairro-alto",
    description: "Bohemian quarter that transforms from quiet daytime streets to vibrant nightlife hub.",
    heroImage: "https://images.unsplash.com/photo-1536663815808-535e2280d2c2?w=800&q=80",
    vibe: ["party", "artsy", "hip"],
    scores: {
      walkability: 82,
      transitConnectivity: 75,
      safety: 78,
      foodCoffeeDensity: 88,
      nightlife: 95,
      touristFriendliness: 85,
      localVibes: 80,
    },
    highlights: ["Nightlife Bars", "Street Art", "Miradouro de Santa Catarina"],
    transitHubs: ["Elevador da Gloria", "Baixa-Chiado Metro"],
    priceLevel: "moderate",
    coordinates: { lat: 38.7139, lng: -9.1444 },
    boundaryCoordinates: [[-9.15, 38.71], [-9.14, 38.71], [-9.14, 38.72], [-9.15, 38.72]],
  },
  {
    id: "baixa-chiado",
    cityId: "lisbon",
    name: "Baixa-Chiado",
    slug: "baixa-chiado",
    description: "Central downtown with grand plazas, upscale shopping, and excellent transit connections.",
    heroImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    vibe: ["historic", "hip", "foodie"],
    scores: {
      walkability: 95,
      transitConnectivity: 98,
      safety: 85,
      foodCoffeeDensity: 92,
      nightlife: 75,
      touristFriendliness: 95,
      localVibes: 60,
    },
    highlights: ["Praca do Comercio", "Rua Augusta", "Cafe A Brasileira"],
    transitHubs: ["Baixa-Chiado Metro", "Rossio Station", "Multiple Tram Lines"],
    priceLevel: "upscale",
    coordinates: { lat: 38.7100, lng: -9.1390 },
    boundaryCoordinates: [[-9.15, 38.70], [-9.13, 38.70], [-9.13, 38.72], [-9.15, 38.72]],
  },
  // Mexico City neighborhoods
  {
    id: "roma-norte",
    cityId: "mexico-city",
    name: "Roma Norte",
    slug: "roma-norte",
    description: "Trendy neighborhood with tree-lined streets, art deco buildings, and thriving food scene.",
    heroImage: "https://images.unsplash.com/photo-1518659526054-190340b32735?w=800&q=80",
    vibe: ["hip", "foodie", "artsy"],
    scores: {
      walkability: 90,
      transitConnectivity: 85,
      safety: 82,
      foodCoffeeDensity: 95,
      nightlife: 88,
      touristFriendliness: 85,
      localVibes: 80,
    },
    highlights: ["Plaza Rio de Janeiro", "Trendy Cafes", "Art Galleries"],
    transitHubs: ["Insurgentes Metro", "Metrobus Line 1"],
    priceLevel: "upscale",
    coordinates: { lat: 19.4194, lng: -99.1617 },
    boundaryCoordinates: [[-99.17, 19.41], [-99.15, 19.41], [-99.15, 19.43], [-99.17, 19.43]],
  },
  {
    id: "condesa",
    cityId: "mexico-city",
    name: "Condesa",
    slug: "condesa",
    description: "Leafy, upscale area with beautiful parks, cafes, and a more relaxed bohemian vibe.",
    heroImage: "https://images.unsplash.com/photo-1547995886-6dc09384c6e6?w=800&q=80",
    vibe: ["quiet", "hip", "foodie"],
    scores: {
      walkability: 92,
      transitConnectivity: 80,
      safety: 85,
      foodCoffeeDensity: 90,
      nightlife: 75,
      touristFriendliness: 88,
      localVibes: 82,
    },
    highlights: ["Parque Mexico", "Parque Espana", "Dog-Friendly Culture"],
    transitHubs: ["Chilpancingo Metro", "Patriotismo Metro"],
    priceLevel: "upscale",
    coordinates: { lat: 19.4114, lng: -99.1727 },
    boundaryCoordinates: [[-99.18, 19.40], [-99.16, 19.40], [-99.16, 19.42], [-99.18, 19.42]],
  },
  {
    id: "coyoacan",
    cityId: "mexico-city",
    name: "Coyoacan",
    slug: "coyoacan",
    description: "Colonial-era neighborhood with cobblestone streets, Frida Kahlo's house, and local markets.",
    heroImage: "https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=800&q=80",
    vibe: ["historic", "artsy", "family"],
    scores: {
      walkability: 85,
      transitConnectivity: 75,
      safety: 88,
      foodCoffeeDensity: 82,
      nightlife: 60,
      touristFriendliness: 90,
      localVibes: 88,
    },
    highlights: ["Frida Kahlo Museum", "Jardin Centenario", "Local Markets"],
    transitHubs: ["Coyoacan Metro", "Viveros Metro"],
    priceLevel: "moderate",
    coordinates: { lat: 19.3500, lng: -99.1623 },
    boundaryCoordinates: [[-99.17, 19.34], [-99.15, 19.34], [-99.15, 19.36], [-99.17, 19.36]],
  },
  // Barcelona neighborhoods
  {
    id: "el-born",
    cityId: "barcelona",
    name: "El Born",
    slug: "el-born",
    description: "Medieval streets meet trendy boutiques, galleries, and the best tapas in the city.",
    heroImage: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80",
    vibe: ["historic", "hip", "foodie"],
    scores: {
      walkability: 95,
      transitConnectivity: 88,
      safety: 80,
      foodCoffeeDensity: 95,
      nightlife: 85,
      touristFriendliness: 90,
      localVibes: 75,
    },
    highlights: ["Picasso Museum", "Santa Maria del Mar", "Mercat del Born"],
    transitHubs: ["Jaume I Metro", "Arc de Triomf Station"],
    priceLevel: "upscale",
    coordinates: { lat: 41.3851, lng: 2.1823 },
    boundaryCoordinates: [[2.17, 41.38], [2.19, 41.38], [2.19, 41.39], [2.17, 41.39]],
  },
  {
    id: "gracia",
    cityId: "barcelona",
    name: "Gracia",
    slug: "gracia",
    description: "Former village with strong local identity, plaza culture, and artisan shops.",
    heroImage: "https://images.unsplash.com/photo-1579282240050-352db0a14c21?w=800&q=80",
    vibe: ["artsy", "quiet", "hip"],
    scores: {
      walkability: 92,
      transitConnectivity: 82,
      safety: 88,
      foodCoffeeDensity: 88,
      nightlife: 70,
      touristFriendliness: 75,
      localVibes: 95,
    },
    highlights: ["Plazas", "Vermouth Culture", "Park Guell nearby"],
    transitHubs: ["Fontana Metro", "Diagonal Metro"],
    priceLevel: "moderate",
    coordinates: { lat: 41.4025, lng: 2.1568 },
    boundaryCoordinates: [[2.14, 41.39], [2.17, 41.39], [2.17, 41.41], [2.14, 41.41]],
  },
  // Amsterdam neighborhoods
  {
    id: "jordaan",
    cityId: "amsterdam",
    name: "Jordaan",
    slug: "jordaan",
    description: "Picturesque canals, indie boutiques, and cozy brown cafes in this beloved neighborhood.",
    heroImage: "https://images.unsplash.com/photo-1576924542622-772281b13aa8?w=800&q=80",
    vibe: ["artsy", "quiet", "historic"],
    scores: {
      walkability: 95,
      transitConnectivity: 85,
      safety: 90,
      foodCoffeeDensity: 88,
      nightlife: 65,
      touristFriendliness: 88,
      localVibes: 85,
    },
    highlights: ["Anne Frank House", "Westerkerk", "Noordermarkt"],
    transitHubs: ["Tram Lines 13, 17", "Central Station nearby"],
    priceLevel: "upscale",
    coordinates: { lat: 52.3750, lng: 4.8810 },
    boundaryCoordinates: [[4.87, 52.37], [4.89, 52.37], [4.89, 52.38], [4.87, 52.38]],
  },
  {
    id: "de-pijp",
    cityId: "amsterdam",
    name: "De Pijp",
    slug: "de-pijp",
    description: "Multicultural neighborhood with famous Albert Cuyp Market and vibrant street life.",
    heroImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    vibe: ["hip", "foodie", "party"],
    scores: {
      walkability: 92,
      transitConnectivity: 88,
      safety: 85,
      foodCoffeeDensity: 95,
      nightlife: 82,
      touristFriendliness: 80,
      localVibes: 88,
    },
    highlights: ["Albert Cuyp Market", "Sarphatipark", "Heineken Experience"],
    transitHubs: ["De Pijp Metro", "Tram Lines 4, 12, 25"],
    priceLevel: "moderate",
    coordinates: { lat: 52.3547, lng: 4.8936 },
    boundaryCoordinates: [[4.88, 52.35], [4.91, 52.35], [4.91, 52.36], [4.88, 52.36]],
  },
  // Singapore neighborhoods
  {
    id: "tiong-bahru",
    cityId: "singapore",
    name: "Tiong Bahru",
    slug: "tiong-bahru",
    description: "Hipster enclave in art deco buildings with specialty coffee and independent bookshops.",
    heroImage: "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800&q=80",
    vibe: ["hip", "artsy", "quiet"],
    scores: {
      walkability: 85,
      transitConnectivity: 90,
      safety: 95,
      foodCoffeeDensity: 90,
      nightlife: 55,
      touristFriendliness: 75,
      localVibes: 88,
    },
    highlights: ["Tiong Bahru Market", "Art Deco Flats", "Specialty Cafes"],
    transitHubs: ["Tiong Bahru MRT", "Bus Lines"],
    priceLevel: "moderate",
    coordinates: { lat: 1.2856, lng: 103.8318 },
    boundaryCoordinates: [[103.82, 1.28], [103.84, 1.28], [103.84, 1.29], [103.82, 1.29]],
  },
  {
    id: "katong",
    cityId: "singapore",
    name: "Katong",
    slug: "katong",
    description: "Peranakan heritage neighborhood with colorful shophouses and legendary laksa.",
    heroImage: "https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800&q=80",
    vibe: ["historic", "foodie", "quiet"],
    scores: {
      walkability: 78,
      transitConnectivity: 75,
      safety: 92,
      foodCoffeeDensity: 88,
      nightlife: 45,
      touristFriendliness: 80,
      localVibes: 92,
    },
    highlights: ["Koon Seng Road", "Katong Laksa", "Peranakan Museum"],
    transitHubs: ["Dakota MRT", "Paya Lebar MRT"],
    priceLevel: "moderate",
    coordinates: { lat: 1.3056, lng: 103.9050 },
    boundaryCoordinates: [[103.89, 1.30], [103.92, 1.30], [103.92, 1.31], [103.89, 1.31]],
  },
];

const hotels: Hotel[] = [
  // Shibuya hotels
  {
    id: "shibuya-stream",
    neighborhoodId: "shibuya",
    name: "Shibuya Stream Excel Hotel Tokyu",
    starRating: 4,
    priceRange: "$180-280/night",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
    affiliateUrl: "https://www.booking.com/hotel/jp/shibuya-stream.html?aid=YOUR_AFFILIATE_ID",
    description: "Modern hotel directly connected to Shibuya Station with stunning city views.",
  },
  {
    id: "shibuya-granbell",
    neighborhoodId: "shibuya",
    name: "Shibuya Granbell Hotel",
    starRating: 3,
    priceRange: "$120-180/night",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80",
    affiliateUrl: "https://www.booking.com/hotel/jp/shibuya-granbell.html?aid=YOUR_AFFILIATE_ID",
    description: "Stylish boutique hotel in the heart of Shibuya's entertainment district.",
  },
  {
    id: "sequence-shibuya",
    neighborhoodId: "shibuya",
    name: "sequence SHIBUYA MIYASHITA PARK",
    starRating: 4,
    priceRange: "$150-220/night",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80",
    affiliateUrl: "https://www.booking.com/hotel/jp/sequence-shibuya.html?aid=YOUR_AFFILIATE_ID",
    description: "Contemporary lifestyle hotel in the renovated Miyashita Park complex.",
  },
  // Shimokitazawa hotels
  {
    id: "mustard-hotel",
    neighborhoodId: "shimokitazawa",
    name: "MUSTARD HOTEL SHIMOKITAZAWA",
    starRating: 3,
    priceRange: "$80-140/night",
    image: "https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=400&q=80",
    affiliateUrl: "https://www.booking.com/hotel/jp/mustard-shimokitazawa.html?aid=YOUR_AFFILIATE_ID",
    description: "Hip boutique hotel perfectly capturing the neighborhood's artistic spirit.",
  },
  // Alfama hotels
  {
    id: "memmo-alfama",
    neighborhoodId: "alfama",
    name: "Memmo Alfama Hotel",
    starRating: 4,
    priceRange: "$150-250/night",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
    affiliateUrl: "https://www.booking.com/hotel/pt/memmo-alfama.html?aid=YOUR_AFFILIATE_ID",
    description: "Design hotel with rooftop terrace and panoramic views of the Tagus River.",
  },
  {
    id: "solar-castelo",
    neighborhoodId: "alfama",
    name: "Solar do Castelo",
    starRating: 4,
    priceRange: "$180-300/night",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80",
    affiliateUrl: "https://www.booking.com/hotel/pt/solar-castelo.html?aid=YOUR_AFFILIATE_ID",
    description: "Historic mansion within castle walls, offering authentic Portuguese charm.",
  },
  // Roma Norte hotels
  {
    id: "casa-goliana",
    neighborhoodId: "roma-norte",
    name: "Casa Goliana",
    starRating: 4,
    priceRange: "$120-200/night",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80",
    affiliateUrl: "https://www.booking.com/hotel/mx/casa-goliana.html?aid=YOUR_AFFILIATE_ID",
    description: "Boutique hotel in restored mansion with beautiful courtyard garden.",
  },
  {
    id: "nima-local",
    neighborhoodId: "roma-norte",
    name: "Nima Local House Hotel",
    starRating: 4,
    priceRange: "$100-170/night",
    image: "https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=400&q=80",
    affiliateUrl: "https://www.booking.com/hotel/mx/nima-local-house.html?aid=YOUR_AFFILIATE_ID",
    description: "Contemporary Mexican design meets colonial architecture in Roma's heart.",
  },
  // El Born hotels
  {
    id: "chic-basic-born",
    neighborhoodId: "el-born",
    name: "Chic & Basic Born",
    starRating: 3,
    priceRange: "$100-180/night",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80",
    affiliateUrl: "https://www.booking.com/hotel/es/chic-basic-born.html?aid=YOUR_AFFILIATE_ID",
    description: "Minimalist design hotel in a 19th century building near Picasso Museum.",
  },
  // Jordaan hotels
  {
    id: "mr-jordaan",
    neighborhoodId: "jordaan",
    name: "Mr. Jordaan",
    starRating: 4,
    priceRange: "$200-350/night",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
    affiliateUrl: "https://www.booking.com/hotel/nl/mr-jordaan.html?aid=YOUR_AFFILIATE_ID",
    description: "Charming canal-side boutique hotel with individually designed rooms.",
  },
  // Tiong Bahru hotels
  {
    id: "hotel-1929",
    neighborhoodId: "tiong-bahru",
    name: "Hotel 1929",
    starRating: 3,
    priceRange: "$100-180/night",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80",
    affiliateUrl: "https://www.booking.com/hotel/sg/1929.html?aid=YOUR_AFFILIATE_ID",
    description: "Heritage boutique hotel known for designer furniture and art deco charm.",
  },
];

export class MemStorage implements IStorage {
  private cities: City[] = cities;
  private neighborhoods: Neighborhood[] = neighborhoods;
  private hotels: Hotel[] = hotels;

  // Favorites operations - use database
  async getFavoritesByUserId(userId: string): Promise<Favorite[]> {
    return db.select().from(favorites).where(eq(favorites.userId, userId));
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const [newFavorite] = await db.insert(favorites).values(favorite).returning();
    return newFavorite;
  }

  async removeFavorite(userId: string, neighborhoodId: string): Promise<void> {
    await db.delete(favorites).where(
      and(eq(favorites.userId, userId), eq(favorites.neighborhoodId, neighborhoodId))
    );
  }

  async isFavorite(userId: string, neighborhoodId: string): Promise<boolean> {
    const [favorite] = await db.select().from(favorites).where(
      and(eq(favorites.userId, userId), eq(favorites.neighborhoodId, neighborhoodId))
    );
    return !!favorite;
  }

  async getCities(): Promise<City[]> {
    return this.cities;
  }

  async getCityBySlug(slug: string): Promise<City | undefined> {
    return this.cities.find((c) => c.slug === slug);
  }

  async getCityById(id: string): Promise<City | undefined> {
    return this.cities.find((c) => c.id === id);
  }

  async getNeighborhoodsByCityId(cityId: string): Promise<Neighborhood[]> {
    return this.neighborhoods.filter((n) => n.cityId === cityId);
  }

  async getNeighborhoodsByCitySlug(slug: string): Promise<Neighborhood[]> {
    const city = await this.getCityBySlug(slug);
    if (!city) return [];
    return this.neighborhoods.filter((n) => n.cityId === city.id);
  }

  async getNeighborhoodById(id: string): Promise<Neighborhood | undefined> {
    return this.neighborhoods.find((n) => n.id === id);
  }

  async getHotelsByNeighborhoodId(neighborhoodId: string): Promise<Hotel[]> {
    return this.hotels.filter((h) => h.neighborhoodId === neighborhoodId);
  }

  async updateNeighborhoodDescription(id: string, description: string): Promise<void> {
    const neighborhood = this.neighborhoods.find((n) => n.id === id);
    if (neighborhood) {
      neighborhood.aiDescription = description;
    }
  }

  async getRecommendations(input: QuestionnaireInput): Promise<Recommendation[]> {
    const cityNeighborhoods = await this.getNeighborhoodsByCityId(input.cityId);
    
    const scoredNeighborhoods = cityNeighborhoods.map((neighborhood) => {
      let score = 0;
      const matchReasons: string[] = [];

      // Budget matching
      if (neighborhood.priceLevel === input.budget) {
        score += 20;
        matchReasons.push(`Perfect for ${input.budget} budgets.`);
      } else if (
        (input.budget === "moderate" && neighborhood.priceLevel === "budget") ||
        (input.budget === "upscale" && neighborhood.priceLevel === "moderate")
      ) {
        score += 10;
      }

      // Vibe matching
      const vibeMatches = input.vibes.filter((v) => neighborhood.vibe.includes(v));
      score += vibeMatches.length * 15;
      if (vibeMatches.length > 0) {
        matchReasons.push(`Matches your ${vibeMatches.join(", ")} vibe preferences.`);
      }

      // Travel style matching
      if (input.travelStyle === "walk") {
        score += neighborhood.scores.walkability / 5;
        if (neighborhood.scores.walkability >= 85) {
          matchReasons.push("Excellent walkability score for exploring on foot.");
        }
      } else if (input.travelStyle === "transit") {
        score += neighborhood.scores.transitConnectivity / 5;
        if (neighborhood.scores.transitConnectivity >= 85) {
          matchReasons.push("Great transit connections throughout the city.");
        }
      } else {
        score += (neighborhood.scores.walkability + neighborhood.scores.transitConnectivity) / 10;
      }

      // Trip purpose adjustments
      switch (input.tripPurpose) {
        case "solo":
          score += neighborhood.scores.safety / 10;
          score += neighborhood.scores.localVibes / 10;
          break;
        case "couples":
          score += neighborhood.scores.foodCoffeeDensity / 10;
          score += neighborhood.scores.safety / 10;
          break;
        case "remote_work":
          score += neighborhood.scores.foodCoffeeDensity / 8;
          score += neighborhood.scores.walkability / 10;
          matchReasons.push("Great cafes for remote work.");
          break;
        case "foodie_trip":
          score += neighborhood.scores.foodCoffeeDensity / 4;
          if (neighborhood.scores.foodCoffeeDensity >= 85) {
            matchReasons.push("Amazing food and coffee scene.");
          }
          break;
        case "family":
          score += neighborhood.scores.safety / 5;
          score += neighborhood.scores.touristFriendliness / 10;
          break;
        case "friends":
          score += neighborhood.scores.nightlife / 6;
          score += neighborhood.scores.foodCoffeeDensity / 10;
          break;
      }

      // Normalize score to 0-100
      const normalizedScore = Math.min(100, Math.round(score));

      return {
        neighborhood,
        matchScore: normalizedScore,
        rank: 0,
        matchReasons,
      };
    });

    // Sort by score and take top 3
    const sorted = scoredNeighborhoods.sort((a, b) => b.matchScore - a.matchScore);
    const top3 = sorted.slice(0, 3).map((rec, index) => ({
      ...rec,
      rank: index + 1,
    }));

    return top3;
  }
}

export const storage = new MemStorage();
