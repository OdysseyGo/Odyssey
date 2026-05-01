import { TourDisplayProps } from './TourDisplayComp.config';

export interface FeaturedTourCarouselProps {
  tours: TourDisplayProps[];
  autoPlayInterval?: number;
}

export const exampleFeaturedTours: TourDisplayProps[] = [
  {
    id: '1',
    image: '',
    title: 'Discover the Wonders of Istanbul',
    author: 'Odyssey Travel',
    duration: '4 hours',
    length: '10 km',
    reviewCount: '150 reviews',
    rating: '4.8',
  },
  {
    id: '2',
    image: '',
    title: 'Paris: City of Lights Tour',
    author: 'EuroTours',
    duration: '6 hours',
    length: '15 km',
    reviewCount: '230 reviews',
    rating: '4.9',
  },
  {
    id: '3',
    image: '',
    title: 'Ancient Rome Walking Tour',
    author: 'Historia Tours',
    duration: '5 hours',
    length: '8 km',
    reviewCount: '180 reviews',
    rating: '4.7',
  },
];
