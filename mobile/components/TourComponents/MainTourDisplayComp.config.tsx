export interface TourDisplayProps {
  image: string;
  title: string;
  author: string;
  duration: string;
  length: string;
  reviewCount: string;
  rating: string;
}

export const exampleTour: TourDisplayProps = {
  image: 'https://picsum.photos/400/300',
  title: 'Istanbul City Tour',
  author: 'Odyssey Travel',
  duration: '4 hours',
  length: '10 km',
  reviewCount: '150 reviews',
  rating: '4.5',
};
