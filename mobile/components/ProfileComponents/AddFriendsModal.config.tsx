export type AddFriendsModalProps = {
  visible: boolean;
  onClose: () => void;
  searchText: string;
  onSearchChange: (text: string) => void;
  searchFocused: boolean;
  onSearchFocus: (focused: boolean) => void;
};

export const exampleAddFriendsModal: AddFriendsModalProps = {
  visible: true,
  onClose: () => console.log('Modal closed'),
  searchText: '',
  onSearchChange: (text: string) => console.log('Search:', text),
  searchFocused: false,
  onSearchFocus: (focused: boolean) => console.log('Search focused:', focused),
};
