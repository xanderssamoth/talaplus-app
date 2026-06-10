import { MediaListData } from '@/types/types';
import { Link } from 'expo-router';
import { View, Text, Image, Pressable } from 'react-native';

type MediaListItemProps = {
  mediaItem: MediaListData;
};

export default function MediaListItem({ mediaItem }: MediaListItemProps) {
  return (
    <Link href={`mediaDetails/${mediaItem.id}`} asChild>
      <Pressable>
        <Image source={{ uri: mediaItem.image}} style={{ width: 140, aspectRatio: 3 / 4, marginHorizontal: 5, borderRadius: 5 }} />
      </Pressable>
    </Link>
  );
};
