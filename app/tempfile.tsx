import { View, Text, Image, FlatList, Pressable, Dimensions, Modal } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useEffect, useState } from 'react';
import tw from 'twrnc';

export default function GalleryScreen() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const numColumns = 3; // Number of columns in the grid
  const imageSize = screenWidth / numColumns - 10; // Adjust image size based on screen width and spacing

  // Load the captured photos
  useEffect(() => {
    const loadPhotos = async () => {
      const dirPath = `${FileSystem.documentDirectory}dashcam`;
      try {
        const photosList = await FileSystem.readDirectoryAsync(dirPath);

        // Sort photos based on their timestamps
        const sortedPhotos = photosList
          .map(file => `${dirPath}/${file}`)
          .sort((a, b) => {
            const timeA = parseInt(a.split('/').pop()?.replace('.jpg', '') || '0', 10);
            const timeB = parseInt(b.split('/').pop()?.replace('.jpg', '') || '0', 10);
            return timeB - timeA; // Sort in descending order (newest first)
          });

        setPhotos(sortedPhotos);
      } catch (error) {
        console.log('Error loading photos:', error);
      }
    };

    loadPhotos();
  }, []);

  // Open expanded view with swiping enabled
  const handleImagePress = (index: number) => {
    setCurrentIndex(index);
    setExpanded(true); // Open modal for expanded view
  };

  const renderGridItem = ({ item, index }: { item: string; index: number }) => (
    <Pressable onPress={() => handleImagePress(index)}>
      <Image
        source={{ uri: item }}
        style={[
          tw`mb-4`,
          { width: imageSize, height: imageSize, margin: 5 } // Set image size and margin for grid layout
        ]}
        resizeMode="cover"
      />
    </Pressable>
  );

  const renderExpandedItem = ({ item }: { item: string }) => (
    <View style={{ width: screenWidth, height: screenHeight }}>
      <Image
        source={{ uri: item }}
        style={{
          width: screenWidth,
          height: screenHeight * 0.8, // Adjust height for padding
          resizeMode: 'contain',
        }}
      />
    </View>
  );

  return (
    <View style={tw`flex-1 bg-gray-800 p-4`}>
      <Text style={tw`text-white text-2xl mb-4`}>Captured Photos</Text>
      {photos.length === 0 ? (
        <Text style={tw`text-white text-center`}>No photos captured yet.</Text>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item}
          renderItem={renderGridItem}
          numColumns={numColumns} // Set number of columns for grid
          key={numColumns} // Force re-render when changing numColumns
        />
      )}

      {/* Modal for expanded view */}
      <Modal visible={expanded} transparent={true}>
        <View style={tw`flex-1 bg-black`}>
          <FlatList
            data={photos}
            keyExtractor={(item) => item}
            renderItem={renderExpandedItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={currentIndex}
            onMomentumScrollEnd={(event) => {
              const index = Math.floor(event.nativeEvent.contentOffset.x / screenWidth);
              setCurrentIndex(index);
            }}
          />
          <Pressable
            style={tw`absolute top-10 right-10 bg-gray-700 p-2 rounded-full`}
            onPress={() => setExpanded(false)} // Close expanded view
          >
            <Text style={tw`text-white text-xl`}>X</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
