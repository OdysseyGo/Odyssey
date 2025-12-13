export type AddFriendsSearchBarProps = {
  searchText: string;
  onSearchChange: (text: string) => void;
  searchFocused: boolean;
  onSearchFocus: (focused: boolean) => void;
};

export const exampleAddFriendsSearchBar: AddFriendsSearchBarProps = {
  searchText: '',
  onSearchChange: (text: string) => console.log('Search:', text),
  searchFocused: false,
  onSearchFocus: (focused: boolean) => console.log('Search focused:', focused),
};
