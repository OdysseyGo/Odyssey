export interface TourDisplayProps {
  id: string;
  image?: string;
  title: string;
  author: string;
  duration: string;
  length: string;
  reviewCount: string;
  rating: string;
  city?: string;
}

export const exampleTour: TourDisplayProps = {
  id: '1',
  image: '',
  title: 'Istanbul City Tour',
  author: 'Odyssey Travel',
  duration: '4 hours',
  length: '10 km',
  reviewCount: '150 reviews',
  rating: '4.5',
  city: 'Istanbul',
};
