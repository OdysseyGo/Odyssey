export interface SearchResultItemProps {
  id: string;
  image?: string;
  title: string;
  author: string;
  duration: string;
  rating: string;
  location: string;
}

// Mock data for search results - will be replaced by API
export const mockSearchResults: SearchResultItemProps[] = [
  {
    id: '1',
    image: '',
    title: 'Istanbul City Tour',
    author: 'Odyssey Travel',
    duration: '4 hours',
    rating: '4.5',
    location: 'Istanbul, Turkey',
  },
  {
    id: '2',
    image: '',
    title: 'Paris Walking Tour',
    author: 'Euro Adventures',
    duration: '3 hours',
    rating: '4.8',
    location: 'Paris, France',
  },
  {
    id: '3',
    image: '',
    title: 'Tokyo Night Tour',
    author: 'Japan Explorer',
    duration: '5 hours',
    rating: '4.7',
    location: 'Tokyo, Japan',
  },
  {
    id: '4',
    image: '',
    title: 'New York Highlights',
    author: 'NYC Tours',
    duration: '6 hours',
    rating: '4.6',
    location: 'New York, USA',
  },
  {
    id: '5',
    image: '',
    title: 'Barcelona Art Walk',
    author: 'Spanish Tours',
    duration: '4 hours',
    rating: '4.9',
    location: 'Barcelona, Spain',
  },
  {
    id: '6',
    image: '',
    title: 'Rome Ancient History',
    author: 'Italia Tours',
    duration: '5 hours',
    rating: '4.8',
    location: 'Rome, Italy',
  },
];

export const recentSearches: string[] = [
  'Istanbul',
  'Paris walking tour',
  'Food tours',
  'Beach destinations',
  'Historical sites',
];
