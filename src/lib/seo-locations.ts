export interface Location {
  slug: string;
  name: string;
  type: 'city' | 'country';
  country?: string; // For cities
  region?: string;
  population?: number;
  tech_scene?: 'major' | 'growing' | 'emerging';
}

export const SEO_LOCATIONS: Location[] = [
  // Major Tech Hubs - Cities
  { slug: 'san-francisco', name: 'San Francisco', type: 'city', country: 'USA', region: 'North America', tech_scene: 'major' },
  { slug: 'new-york', name: 'New York', type: 'city', country: 'USA', region: 'North America', tech_scene: 'major' },
  { slug: 'london', name: 'London', type: 'city', country: 'UK', region: 'Europe', tech_scene: 'major' },
  { slug: 'berlin', name: 'Berlin', type: 'city', country: 'Germany', region: 'Europe', tech_scene: 'major' },
  { slug: 'paris', name: 'Paris', type: 'city', country: 'France', region: 'Europe', tech_scene: 'major' },
  { slug: 'tokyo', name: 'Tokyo', type: 'city', country: 'Japan', region: 'Asia', tech_scene: 'major' },
  { slug: 'singapore', name: 'Singapore', type: 'city', country: 'Singapore', region: 'Asia', tech_scene: 'major' },
  { slug: 'beijing', name: 'Beijing', type: 'city', country: 'China', region: 'Asia', tech_scene: 'major' },
  { slug: 'shanghai', name: 'Shanghai', type: 'city', country: 'China', region: 'Asia', tech_scene: 'major' },
  { slug: 'bangalore', name: 'Bangalore', type: 'city', country: 'India', region: 'Asia', tech_scene: 'major' },
  { slug: 'tel-aviv', name: 'Tel Aviv', type: 'city', country: 'Israel', region: 'Middle East', tech_scene: 'major' },
  { slug: 'stockholm', name: 'Stockholm', type: 'city', country: 'Sweden', region: 'Europe', tech_scene: 'major' },
  { slug: 'amsterdam', name: 'Amsterdam', type: 'city', country: 'Netherlands', region: 'Europe', tech_scene: 'major' },
  { slug: 'toronto', name: 'Toronto', type: 'city', country: 'Canada', region: 'North America', tech_scene: 'major' },
  { slug: 'sydney', name: 'Sydney', type: 'city', country: 'Australia', region: 'Oceania', tech_scene: 'major' },
  
  // Growing Tech Cities
  { slug: 'austin', name: 'Austin', type: 'city', country: 'USA', region: 'North America', tech_scene: 'growing' },
  { slug: 'seattle', name: 'Seattle', type: 'city', country: 'USA', region: 'North America', tech_scene: 'major' },
  { slug: 'boston', name: 'Boston', type: 'city', country: 'USA', region: 'North America', tech_scene: 'major' },
  { slug: 'los-angeles', name: 'Los Angeles', type: 'city', country: 'USA', region: 'North America', tech_scene: 'growing' },
  { slug: 'chicago', name: 'Chicago', type: 'city', country: 'USA', region: 'North America', tech_scene: 'growing' },
  { slug: 'miami', name: 'Miami', type: 'city', country: 'USA', region: 'North America', tech_scene: 'growing' },
  { slug: 'denver', name: 'Denver', type: 'city', country: 'USA', region: 'North America', tech_scene: 'growing' },
  { slug: 'atlanta', name: 'Atlanta', type: 'city', country: 'USA', region: 'North America', tech_scene: 'growing' },
  { slug: 'vancouver', name: 'Vancouver', type: 'city', country: 'Canada', region: 'North America', tech_scene: 'growing' },
  { slug: 'montreal', name: 'Montreal', type: 'city', country: 'Canada', region: 'North America', tech_scene: 'growing' },
  
  // European Tech Cities
  { slug: 'munich', name: 'Munich', type: 'city', country: 'Germany', region: 'Europe', tech_scene: 'growing' },
  { slug: 'zurich', name: 'Zurich', type: 'city', country: 'Switzerland', region: 'Europe', tech_scene: 'growing' },
  { slug: 'copenhagen', name: 'Copenhagen', type: 'city', country: 'Denmark', region: 'Europe', tech_scene: 'growing' },
  { slug: 'helsinki', name: 'Helsinki', type: 'city', country: 'Finland', region: 'Europe', tech_scene: 'growing' },
  { slug: 'oslo', name: 'Oslo', type: 'city', country: 'Norway', region: 'Europe', tech_scene: 'growing' },
  { slug: 'dublin', name: 'Dublin', type: 'city', country: 'Ireland', region: 'Europe', tech_scene: 'growing' },
  { slug: 'barcelona', name: 'Barcelona', type: 'city', country: 'Spain', region: 'Europe', tech_scene: 'growing' },
  { slug: 'madrid', name: 'Madrid', type: 'city', country: 'Spain', region: 'Europe', tech_scene: 'growing' },
  { slug: 'lisbon', name: 'Lisbon', type: 'city', country: 'Portugal', region: 'Europe', tech_scene: 'growing' },
  { slug: 'milan', name: 'Milan', type: 'city', country: 'Italy', region: 'Europe', tech_scene: 'growing' },
  { slug: 'vienna', name: 'Vienna', type: 'city', country: 'Austria', region: 'Europe', tech_scene: 'growing' },
  { slug: 'prague', name: 'Prague', type: 'city', country: 'Czech Republic', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'warsaw', name: 'Warsaw', type: 'city', country: 'Poland', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'budapest', name: 'Budapest', type: 'city', country: 'Hungary', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'bucharest', name: 'Bucharest', type: 'city', country: 'Romania', region: 'Europe', tech_scene: 'emerging' },
  
  // More European Cities - Germany
  { slug: 'frankfurt', name: 'Frankfurt', type: 'city', country: 'Germany', region: 'Europe', tech_scene: 'growing' },
  { slug: 'hamburg', name: 'Hamburg', type: 'city', country: 'Germany', region: 'Europe', tech_scene: 'growing' },
  { slug: 'cologne', name: 'Cologne', type: 'city', country: 'Germany', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'stuttgart', name: 'Stuttgart', type: 'city', country: 'Germany', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'dusseldorf', name: 'Düsseldorf', type: 'city', country: 'Germany', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'dortmund', name: 'Dortmund', type: 'city', country: 'Germany', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'essen', name: 'Essen', type: 'city', country: 'Germany', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'leipzig', name: 'Leipzig', type: 'city', country: 'Germany', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'dresden', name: 'Dresden', type: 'city', country: 'Germany', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'nuremberg', name: 'Nuremberg', type: 'city', country: 'Germany', region: 'Europe', tech_scene: 'emerging' },
  
  // UK Cities
  { slug: 'manchester', name: 'Manchester', type: 'city', country: 'UK', region: 'Europe', tech_scene: 'growing' },
  { slug: 'edinburgh', name: 'Edinburgh', type: 'city', country: 'UK', region: 'Europe', tech_scene: 'growing' },
  { slug: 'birmingham', name: 'Birmingham', type: 'city', country: 'UK', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'glasgow', name: 'Glasgow', type: 'city', country: 'UK', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'leeds', name: 'Leeds', type: 'city', country: 'UK', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'liverpool', name: 'Liverpool', type: 'city', country: 'UK', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'bristol', name: 'Bristol', type: 'city', country: 'UK', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'cambridge', name: 'Cambridge', type: 'city', country: 'UK', region: 'Europe', tech_scene: 'growing' },
  { slug: 'oxford', name: 'Oxford', type: 'city', country: 'UK', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'nottingham', name: 'Nottingham', type: 'city', country: 'UK', region: 'Europe', tech_scene: 'emerging' },
  
  // France Cities
  { slug: 'lyon', name: 'Lyon', type: 'city', country: 'France', region: 'Europe', tech_scene: 'growing' },
  { slug: 'marseille', name: 'Marseille', type: 'city', country: 'France', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'toulouse', name: 'Toulouse', type: 'city', country: 'France', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'nice', name: 'Nice', type: 'city', country: 'France', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'nantes', name: 'Nantes', type: 'city', country: 'France', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'strasbourg', name: 'Strasbourg', type: 'city', country: 'France', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'bordeaux', name: 'Bordeaux', type: 'city', country: 'France', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'lille', name: 'Lille', type: 'city', country: 'France', region: 'Europe', tech_scene: 'emerging' },
  
  // Spain Cities
  { slug: 'valencia', name: 'Valencia', type: 'city', country: 'Spain', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'seville', name: 'Seville', type: 'city', country: 'Spain', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'zaragoza', name: 'Zaragoza', type: 'city', country: 'Spain', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'malaga', name: 'Málaga', type: 'city', country: 'Spain', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'bilbao', name: 'Bilbao', type: 'city', country: 'Spain', region: 'Europe', tech_scene: 'emerging' },
  
  // Italy Cities
  { slug: 'rome', name: 'Rome', type: 'city', country: 'Italy', region: 'Europe', tech_scene: 'growing' },
  { slug: 'turin', name: 'Turin', type: 'city', country: 'Italy', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'florence', name: 'Florence', type: 'city', country: 'Italy', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'naples', name: 'Naples', type: 'city', country: 'Italy', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'bologna', name: 'Bologna', type: 'city', country: 'Italy', region: 'Europe', tech_scene: 'emerging' },
  
  // Netherlands Cities
  { slug: 'rotterdam', name: 'Rotterdam', type: 'city', country: 'Netherlands', region: 'Europe', tech_scene: 'growing' },
  { slug: 'the-hague', name: 'The Hague', type: 'city', country: 'Netherlands', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'utrecht', name: 'Utrecht', type: 'city', country: 'Netherlands', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'eindhoven', name: 'Eindhoven', type: 'city', country: 'Netherlands', region: 'Europe', tech_scene: 'emerging' },
  
  // Belgium Cities
  { slug: 'brussels', name: 'Brussels', type: 'city', country: 'Belgium', region: 'Europe', tech_scene: 'growing' },
  { slug: 'antwerp', name: 'Antwerp', type: 'city', country: 'Belgium', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'ghent', name: 'Ghent', type: 'city', country: 'Belgium', region: 'Europe', tech_scene: 'emerging' },
  
  // Switzerland Cities
  { slug: 'geneva', name: 'Geneva', type: 'city', country: 'Switzerland', region: 'Europe', tech_scene: 'growing' },
  { slug: 'basel', name: 'Basel', type: 'city', country: 'Switzerland', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'lausanne', name: 'Lausanne', type: 'city', country: 'Switzerland', region: 'Europe', tech_scene: 'emerging' },
  
  // Sweden Cities
  { slug: 'gothenburg', name: 'Gothenburg', type: 'city', country: 'Sweden', region: 'Europe', tech_scene: 'growing' },
  { slug: 'malmo', name: 'Malmö', type: 'city', country: 'Sweden', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'uppsala', name: 'Uppsala', type: 'city', country: 'Sweden', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'linkoping', name: 'Linköping', type: 'city', country: 'Sweden', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'lund', name: 'Lund', type: 'city', country: 'Sweden', region: 'Europe', tech_scene: 'emerging' },
  
  // Denmark Cities
  { slug: 'aarhus', name: 'Aarhus', type: 'city', country: 'Denmark', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'odense', name: 'Odense', type: 'city', country: 'Denmark', region: 'Europe', tech_scene: 'emerging' },
  
  // Norway Cities
  { slug: 'bergen', name: 'Bergen', type: 'city', country: 'Norway', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'trondheim', name: 'Trondheim', type: 'city', country: 'Norway', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'stavanger', name: 'Stavanger', type: 'city', country: 'Norway', region: 'Europe', tech_scene: 'emerging' },
  
  // Finland Cities
  { slug: 'espoo', name: 'Espoo', type: 'city', country: 'Finland', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'tampere', name: 'Tampere', type: 'city', country: 'Finland', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'turku', name: 'Turku', type: 'city', country: 'Finland', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'oulu', name: 'Oulu', type: 'city', country: 'Finland', region: 'Europe', tech_scene: 'emerging' },
  
  // Poland Cities
  { slug: 'krakow', name: 'Kraków', type: 'city', country: 'Poland', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'wroclaw', name: 'Wrocław', type: 'city', country: 'Poland', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'poznan', name: 'Poznań', type: 'city', country: 'Poland', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'gdansk', name: 'Gdańsk', type: 'city', country: 'Poland', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'lodz', name: 'Łódź', type: 'city', country: 'Poland', region: 'Europe', tech_scene: 'emerging' },
  
  // Austria Cities
  { slug: 'graz', name: 'Graz', type: 'city', country: 'Austria', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'salzburg', name: 'Salzburg', type: 'city', country: 'Austria', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'linz', name: 'Linz', type: 'city', country: 'Austria', region: 'Europe', tech_scene: 'emerging' },
  
  // Portugal Cities
  { slug: 'porto', name: 'Porto', type: 'city', country: 'Portugal', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'braga', name: 'Braga', type: 'city', country: 'Portugal', region: 'Europe', tech_scene: 'emerging' },
  
  // Greece Cities
  { slug: 'athens', name: 'Athens', type: 'city', country: 'Greece', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'thessaloniki', name: 'Thessaloniki', type: 'city', country: 'Greece', region: 'Europe', tech_scene: 'emerging' },
  
  // Romania Cities
  { slug: 'cluj-napoca', name: 'Cluj-Napoca', type: 'city', country: 'Romania', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'timisoara', name: 'Timișoara', type: 'city', country: 'Romania', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'brasov', name: 'Brașov', type: 'city', country: 'Romania', region: 'Europe', tech_scene: 'emerging' },
  
  // Bulgaria Cities
  { slug: 'sofia', name: 'Sofia', type: 'city', country: 'Bulgaria', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'plovdiv', name: 'Plovdiv', type: 'city', country: 'Bulgaria', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'varna', name: 'Varna', type: 'city', country: 'Bulgaria', region: 'Europe', tech_scene: 'emerging' },
  
  // Croatia Cities
  { slug: 'zagreb', name: 'Zagreb', type: 'city', country: 'Croatia', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'split', name: 'Split', type: 'city', country: 'Croatia', region: 'Europe', tech_scene: 'emerging' },
  
  // Serbia Cities
  { slug: 'belgrade', name: 'Belgrade', type: 'city', country: 'Serbia', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'novi-sad', name: 'Novi Sad', type: 'city', country: 'Serbia', region: 'Europe', tech_scene: 'emerging' },
  
  // Slovenia
  { slug: 'ljubljana', name: 'Ljubljana', type: 'city', country: 'Slovenia', region: 'Europe', tech_scene: 'emerging' },
  
  // Slovakia
  { slug: 'bratislava', name: 'Bratislava', type: 'city', country: 'Slovakia', region: 'Europe', tech_scene: 'emerging' },
  
  // Estonia
  { slug: 'tallinn', name: 'Tallinn', type: 'city', country: 'Estonia', region: 'Europe', tech_scene: 'growing' },
  { slug: 'tartu', name: 'Tartu', type: 'city', country: 'Estonia', region: 'Europe', tech_scene: 'emerging' },
  
  // Latvia
  { slug: 'riga', name: 'Riga', type: 'city', country: 'Latvia', region: 'Europe', tech_scene: 'emerging' },
  
  // Lithuania
  { slug: 'vilnius', name: 'Vilnius', type: 'city', country: 'Lithuania', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'kaunas', name: 'Kaunas', type: 'city', country: 'Lithuania', region: 'Europe', tech_scene: 'emerging' },
  
  // Iceland
  { slug: 'reykjavik', name: 'Reykjavík', type: 'city', country: 'Iceland', region: 'Europe', tech_scene: 'emerging' },
  
  // Luxembourg
  { slug: 'luxembourg-city', name: 'Luxembourg City', type: 'city', country: 'Luxembourg', region: 'Europe', tech_scene: 'emerging' },
  
  // More Scandinavian Cities
  { slug: 'vejle', name: 'Vejle', type: 'city', country: 'Denmark', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'aalborg', name: 'Aalborg', type: 'city', country: 'Denmark', region: 'Europe', tech_scene: 'emerging' },
  
  // Turkey Cities
  { slug: 'istanbul', name: 'Istanbul', type: 'city', country: 'Turkey', region: 'Europe', tech_scene: 'growing' },
  { slug: 'ankara', name: 'Ankara', type: 'city', country: 'Turkey', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'izmir', name: 'Izmir', type: 'city', country: 'Turkey', region: 'Europe', tech_scene: 'emerging' },
  
  // Russia Cities
  { slug: 'moscow', name: 'Moscow', type: 'city', country: 'Russia', region: 'Europe', tech_scene: 'growing' },
  { slug: 'saint-petersburg', name: 'Saint Petersburg', type: 'city', country: 'Russia', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'novosibirsk', name: 'Novosibirsk', type: 'city', country: 'Russia', region: 'Europe', tech_scene: 'emerging' },
  
  // Ukraine Cities
  { slug: 'kyiv', name: 'Kyiv', type: 'city', country: 'Ukraine', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'lviv', name: 'Lviv', type: 'city', country: 'Ukraine', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'kharkiv', name: 'Kharkiv', type: 'city', country: 'Ukraine', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'odesa', name: 'Odesa', type: 'city', country: 'Ukraine', region: 'Europe', tech_scene: 'emerging' },
  
  // Belarus
  { slug: 'minsk', name: 'Minsk', type: 'city', country: 'Belarus', region: 'Europe', tech_scene: 'emerging' },
  
  // Moldova
  { slug: 'chisinau', name: 'Chișinău', type: 'city', country: 'Moldova', region: 'Europe', tech_scene: 'emerging' },
  
  // Albania
  { slug: 'tirana', name: 'Tirana', type: 'city', country: 'Albania', region: 'Europe', tech_scene: 'emerging' },
  
  // North Macedonia
  { slug: 'skopje', name: 'Skopje', type: 'city', country: 'North Macedonia', region: 'Europe', tech_scene: 'emerging' },
  
  // Bosnia
  { slug: 'sarajevo', name: 'Sarajevo', type: 'city', country: 'Bosnia and Herzegovina', region: 'Europe', tech_scene: 'emerging' },
  
  // Montenegro
  { slug: 'podgorica', name: 'Podgorica', type: 'city', country: 'Montenegro', region: 'Europe', tech_scene: 'emerging' },
  
  // Malta
  { slug: 'valletta', name: 'Valletta', type: 'city', country: 'Malta', region: 'Europe', tech_scene: 'emerging' },
  
  // Cyprus
  { slug: 'nicosia', name: 'Nicosia', type: 'city', country: 'Cyprus', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'limassol', name: 'Limassol', type: 'city', country: 'Cyprus', region: 'Europe', tech_scene: 'emerging' },
  
  // Switzerland (additional)
  { slug: 'bern', name: 'Bern', type: 'city', country: 'Switzerland', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'lugano', name: 'Lugano', type: 'city', country: 'Switzerland', region: 'Europe', tech_scene: 'emerging' },
  
  // More German Cities
  { slug: 'bremen', name: 'Bremen', type: 'city', country: 'Germany', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'hannover', name: 'Hannover', type: 'city', country: 'Germany', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'bonn', name: 'Bonn', type: 'city', country: 'Germany', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'karlsruhe', name: 'Karlsruhe', type: 'city', country: 'Germany', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'mannheim', name: 'Mannheim', type: 'city', country: 'Germany', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'munster', name: 'Münster', type: 'city', country: 'Germany', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'augsburg', name: 'Augsburg', type: 'city', country: 'Germany', region: 'Europe', tech_scene: 'emerging' },
  
  // More UK Cities
  { slug: 'newcastle', name: 'Newcastle', type: 'city', country: 'UK', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'sheffield', name: 'Sheffield', type: 'city', country: 'UK', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'leicester', name: 'Leicester', type: 'city', country: 'UK', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'southampton', name: 'Southampton', type: 'city', country: 'UK', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'brighton', name: 'Brighton', type: 'city', country: 'UK', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'reading', name: 'Reading', type: 'city', country: 'UK', region: 'Europe', tech_scene: 'emerging' },
  
  // Czech Republic Cities
  { slug: 'brno', name: 'Brno', type: 'city', country: 'Czech Republic', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'ostrava', name: 'Ostrava', type: 'city', country: 'Czech Republic', region: 'Europe', tech_scene: 'emerging' },
  
  // Hungary Cities
  { slug: 'debrecen', name: 'Debrecen', type: 'city', country: 'Hungary', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'szeged', name: 'Szeged', type: 'city', country: 'Hungary', region: 'Europe', tech_scene: 'emerging' },
  
  // Asian Tech Cities
  { slug: 'hong-kong', name: 'Hong Kong', type: 'city', country: 'China', region: 'Asia', tech_scene: 'major' },
  { slug: 'seoul', name: 'Seoul', type: 'city', country: 'South Korea', region: 'Asia', tech_scene: 'major' },
  { slug: 'taipei', name: 'Taipei', type: 'city', country: 'Taiwan', region: 'Asia', tech_scene: 'growing' },
  { slug: 'bangkok', name: 'Bangkok', type: 'city', country: 'Thailand', region: 'Asia', tech_scene: 'emerging' },
  { slug: 'jakarta', name: 'Jakarta', type: 'city', country: 'Indonesia', region: 'Asia', tech_scene: 'emerging' },
  { slug: 'manila', name: 'Manila', type: 'city', country: 'Philippines', region: 'Asia', tech_scene: 'emerging' },
  { slug: 'ho-chi-minh-city', name: 'Ho Chi Minh City', type: 'city', country: 'Vietnam', region: 'Asia', tech_scene: 'emerging' },
  { slug: 'kuala-lumpur', name: 'Kuala Lumpur', type: 'city', country: 'Malaysia', region: 'Asia', tech_scene: 'emerging' },
  { slug: 'delhi', name: 'Delhi', type: 'city', country: 'India', region: 'Asia', tech_scene: 'growing' },
  { slug: 'mumbai', name: 'Mumbai', type: 'city', country: 'India', region: 'Asia', tech_scene: 'growing' },
  { slug: 'hyderabad', name: 'Hyderabad', type: 'city', country: 'India', region: 'Asia', tech_scene: 'growing' },
  { slug: 'pune', name: 'Pune', type: 'city', country: 'India', region: 'Asia', tech_scene: 'growing' },
  { slug: 'chennai', name: 'Chennai', type: 'city', country: 'India', region: 'Asia', tech_scene: 'growing' },
  
  // Middle East & Africa
  { slug: 'dubai', name: 'Dubai', type: 'city', country: 'UAE', region: 'Middle East', tech_scene: 'growing' },
  { slug: 'abu-dhabi', name: 'Abu Dhabi', type: 'city', country: 'UAE', region: 'Middle East', tech_scene: 'emerging' },
  { slug: 'riyadh', name: 'Riyadh', type: 'city', country: 'Saudi Arabia', region: 'Middle East', tech_scene: 'emerging' },
  { slug: 'cairo', name: 'Cairo', type: 'city', country: 'Egypt', region: 'Africa', tech_scene: 'emerging' },
  { slug: 'johannesburg', name: 'Johannesburg', type: 'city', country: 'South Africa', region: 'Africa', tech_scene: 'emerging' },
  { slug: 'cape-town', name: 'Cape Town', type: 'city', country: 'South Africa', region: 'Africa', tech_scene: 'emerging' },
  { slug: 'nairobi', name: 'Nairobi', type: 'city', country: 'Kenya', region: 'Africa', tech_scene: 'emerging' },
  { slug: 'lagos', name: 'Lagos', type: 'city', country: 'Nigeria', region: 'Africa', tech_scene: 'emerging' },
  
  // Latin America
  { slug: 'sao-paulo', name: 'São Paulo', type: 'city', country: 'Brazil', region: 'South America', tech_scene: 'growing' },
  { slug: 'mexico-city', name: 'Mexico City', type: 'city', country: 'Mexico', region: 'North America', tech_scene: 'growing' },
  { slug: 'buenos-aires', name: 'Buenos Aires', type: 'city', country: 'Argentina', region: 'South America', tech_scene: 'emerging' },
  { slug: 'santiago', name: 'Santiago', type: 'city', country: 'Chile', region: 'South America', tech_scene: 'emerging' },
  { slug: 'bogota', name: 'Bogotá', type: 'city', country: 'Colombia', region: 'South America', tech_scene: 'emerging' },
  { slug: 'lima', name: 'Lima', type: 'city', country: 'Peru', region: 'South America', tech_scene: 'emerging' },
  
  // Countries
  { slug: 'united-states', name: 'United States', type: 'country', region: 'North America', tech_scene: 'major' },
  { slug: 'united-kingdom', name: 'United Kingdom', type: 'country', region: 'Europe', tech_scene: 'major' },
  { slug: 'canada', name: 'Canada', type: 'country', region: 'North America', tech_scene: 'major' },
  { slug: 'germany', name: 'Germany', type: 'country', region: 'Europe', tech_scene: 'major' },
  { slug: 'france', name: 'France', type: 'country', region: 'Europe', tech_scene: 'major' },
  { slug: 'netherlands', name: 'Netherlands', type: 'country', region: 'Europe', tech_scene: 'major' },
  { slug: 'sweden', name: 'Sweden', type: 'country', region: 'Europe', tech_scene: 'major' },
  { slug: 'switzerland', name: 'Switzerland', type: 'country', region: 'Europe', tech_scene: 'major' },
  { slug: 'denmark', name: 'Denmark', type: 'country', region: 'Europe', tech_scene: 'growing' },
  { slug: 'norway', name: 'Norway', type: 'country', region: 'Europe', tech_scene: 'growing' },
  { slug: 'finland', name: 'Finland', type: 'country', region: 'Europe', tech_scene: 'growing' },
  { slug: 'ireland', name: 'Ireland', type: 'country', region: 'Europe', tech_scene: 'growing' },
  { slug: 'spain', name: 'Spain', type: 'country', region: 'Europe', tech_scene: 'growing' },
  { slug: 'italy', name: 'Italy', type: 'country', region: 'Europe', tech_scene: 'growing' },
  { slug: 'portugal', name: 'Portugal', type: 'country', region: 'Europe', tech_scene: 'growing' },
  { slug: 'belgium', name: 'Belgium', type: 'country', region: 'Europe', tech_scene: 'growing' },
  { slug: 'austria', name: 'Austria', type: 'country', region: 'Europe', tech_scene: 'growing' },
  { slug: 'poland', name: 'Poland', type: 'country', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'czech-republic', name: 'Czech Republic', type: 'country', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'hungary', name: 'Hungary', type: 'country', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'romania', name: 'Romania', type: 'country', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'greece', name: 'Greece', type: 'country', region: 'Europe', tech_scene: 'emerging' },
  { slug: 'turkey', name: 'Turkey', type: 'country', region: 'Europe/Asia', tech_scene: 'emerging' },
  { slug: 'russia', name: 'Russia', type: 'country', region: 'Europe/Asia', tech_scene: 'emerging' },
  { slug: 'ukraine', name: 'Ukraine', type: 'country', region: 'Europe', tech_scene: 'emerging' },
  
  // Asian Countries
  { slug: 'china', name: 'China', type: 'country', region: 'Asia', tech_scene: 'major' },
  { slug: 'japan', name: 'Japan', type: 'country', region: 'Asia', tech_scene: 'major' },
  { slug: 'south-korea', name: 'South Korea', type: 'country', region: 'Asia', tech_scene: 'major' },
  { slug: 'singapore', name: 'Singapore', type: 'country', region: 'Asia', tech_scene: 'major' },
  { slug: 'india', name: 'India', type: 'country', region: 'Asia', tech_scene: 'major' },
  { slug: 'israel', name: 'Israel', type: 'country', region: 'Middle East', tech_scene: 'major' },
  { slug: 'australia', name: 'Australia', type: 'country', region: 'Oceania', tech_scene: 'major' },
  { slug: 'new-zealand', name: 'New Zealand', type: 'country', region: 'Oceania', tech_scene: 'growing' },
  { slug: 'taiwan', name: 'Taiwan', type: 'country', region: 'Asia', tech_scene: 'growing' },
  { slug: 'hong-kong', name: 'Hong Kong', type: 'country', region: 'Asia', tech_scene: 'major' },
  { slug: 'thailand', name: 'Thailand', type: 'country', region: 'Asia', tech_scene: 'emerging' },
  { slug: 'indonesia', name: 'Indonesia', type: 'country', region: 'Asia', tech_scene: 'emerging' },
  { slug: 'malaysia', name: 'Malaysia', type: 'country', region: 'Asia', tech_scene: 'emerging' },
  { slug: 'philippines', name: 'Philippines', type: 'country', region: 'Asia', tech_scene: 'emerging' },
  { slug: 'vietnam', name: 'Vietnam', type: 'country', region: 'Asia', tech_scene: 'emerging' },
  { slug: 'pakistan', name: 'Pakistan', type: 'country', region: 'Asia', tech_scene: 'emerging' },
  { slug: 'bangladesh', name: 'Bangladesh', type: 'country', region: 'Asia', tech_scene: 'emerging' },
  
  // Middle East Countries
  { slug: 'united-arab-emirates', name: 'United Arab Emirates', type: 'country', region: 'Middle East', tech_scene: 'growing' },
  { slug: 'saudi-arabia', name: 'Saudi Arabia', type: 'country', region: 'Middle East', tech_scene: 'emerging' },
  { slug: 'qatar', name: 'Qatar', type: 'country', region: 'Middle East', tech_scene: 'emerging' },
  { slug: 'kuwait', name: 'Kuwait', type: 'country', region: 'Middle East', tech_scene: 'emerging' },
  { slug: 'bahrain', name: 'Bahrain', type: 'country', region: 'Middle East', tech_scene: 'emerging' },
  { slug: 'jordan', name: 'Jordan', type: 'country', region: 'Middle East', tech_scene: 'emerging' },
  { slug: 'lebanon', name: 'Lebanon', type: 'country', region: 'Middle East', tech_scene: 'emerging' },
  
  // African Countries
  { slug: 'south-africa', name: 'South Africa', type: 'country', region: 'Africa', tech_scene: 'emerging' },
  { slug: 'nigeria', name: 'Nigeria', type: 'country', region: 'Africa', tech_scene: 'emerging' },
  { slug: 'kenya', name: 'Kenya', type: 'country', region: 'Africa', tech_scene: 'emerging' },
  { slug: 'egypt', name: 'Egypt', type: 'country', region: 'Africa', tech_scene: 'emerging' },
  { slug: 'morocco', name: 'Morocco', type: 'country', region: 'Africa', tech_scene: 'emerging' },
  { slug: 'tunisia', name: 'Tunisia', type: 'country', region: 'Africa', tech_scene: 'emerging' },
  { slug: 'ghana', name: 'Ghana', type: 'country', region: 'Africa', tech_scene: 'emerging' },
  
  // Latin American Countries
  { slug: 'brazil', name: 'Brazil', type: 'country', region: 'South America', tech_scene: 'growing' },
  { slug: 'mexico', name: 'Mexico', type: 'country', region: 'North America', tech_scene: 'growing' },
  { slug: 'argentina', name: 'Argentina', type: 'country', region: 'South America', tech_scene: 'emerging' },
  { slug: 'chile', name: 'Chile', type: 'country', region: 'South America', tech_scene: 'emerging' },
  { slug: 'colombia', name: 'Colombia', type: 'country', region: 'South America', tech_scene: 'emerging' },
  { slug: 'peru', name: 'Peru', type: 'country', region: 'South America', tech_scene: 'emerging' },
  { slug: 'uruguay', name: 'Uruguay', type: 'country', region: 'South America', tech_scene: 'emerging' },
  { slug: 'costa-rica', name: 'Costa Rica', type: 'country', region: 'Central America', tech_scene: 'emerging' },
  { slug: 'panama', name: 'Panama', type: 'country', region: 'Central America', tech_scene: 'emerging' }
];
