import { useState, useEffect } from 'react';
import { View, Image, FlatList, Text, ActivityIndicator, Dimensions, Pressable, Modal, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library'; // Import Media Library for saving images
import tw from 'twrnc';
import { useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';

export default function GalleryScreen() {
  const { folder } = useLocalSearchParams<{ folder: string }>();
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedImageLocation, setSelectedImageLocation] = useState<any>(null);

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const numColumns = 3;
  const imageSize = (screenWidth / numColumns) - 10;

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const folderPath = `${FileSystem.documentDirectory}dashcam/${folder}`;
        const files = await FileSystem.readDirectoryAsync(folderPath);

        const imageFiles = files.filter(file => file.endsWith('.jpg'));
        console.log(imageFiles)
        const sortedPhotos = imageFiles
          .map(file => {
            // Extract the timestamp from the filename
            const timestampMatch = file.match(/(\d+)(?:_lat|_lng|\.jpg)/);
            const timestamp = timestampMatch ? parseInt(timestampMatch[1], 10) : 0;

            return {
              uri: `${folderPath}/${file}`,
              timestamp,
            };
          })
          .sort((a, b) => b.timestamp - a.timestamp) // Sort in descending order (newest first)
          .map(photo => photo.uri);

        setImages(sortedPhotos);
      } catch (error) {
        console.error('Error fetching images:', error);
        setError('Error fetching images.');
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [folder]);

  const toggleImageSelection = (image: string) => {
    if (selectedImages.includes(image)) {
      setSelectedImages(selectedImages.filter((img) => img !== image));
    } else {
      setSelectedImages([...selectedImages, image]);
    }
  };

  const handleImagePress = async (index: number) => {
    if (selectMode) {
      toggleImageSelection(images[index]);
    } else {
      setCurrentIndex(index);
      setExpanded(true);
  
      // Extract filename from imageUri
      const filename = images[index].split('/').pop() || '';
      
      // Extract location coordinates from filename
      const coordinates = extractCoordinatesFromFilename(filename);
      console.log(coordinates)
      setSelectedImageLocation(coordinates);
    }
  };

  const handleBulkSave = async () => {
    try {
      for (const image of selectedImages) {
        await MediaLibrary.saveToLibraryAsync(image); // Save each selected image
      }
      Alert.alert('Success', 'Selected images saved to gallery!');
      setSelectedImages([]); // Clear selected images after saving
    } catch (error) {
      console.error('Error saving images:', error);
      Alert.alert('Error', 'Failed to save selected images.');
    }
  };

  const handleLongPress = (image: string) => {
    setSelectMode(true);
    toggleImageSelection(image);
  };

  const deleteSelectedImages = async () => {
    try {
      for (const image of selectedImages) {
        await FileSystem.deleteAsync(image, { idempotent: true });
      }
      setImages(images.filter(image => !selectedImages.includes(image)));
      setSelectedImages([]);
      setSelectMode(false);
    } catch (error) {
      Alert.alert('Error deleting images', error.message);
    }
  };

  const cancelSelection = () => {
    setSelectedImages([]);
    setSelectMode(false);
  };

  const selectAllImages = () => {
    setSelectedImages(images);
  };

  const extractCoordinatesFromFilename = (filename: string) => {
    // Regular expression to extract latitude and longitude from filename
    const regex = /lat(\d+_\d+)_lng(\d+_\d+)/;
    const match = filename.match(regex);
    
    if (match) {
      // Replace underscores with dots and convert to floats
      const latitude = parseFloat(match[1].replace('_', '.'));
      const longitude = parseFloat(match[2].replace('_', '.'));
  
      return {
        latitude,
        longitude,
      };
    }
  
    return null;
  };

  const renderExpandedItem = ({ item }: { item: string }) => (
    <View style={{ width: screenWidth, height: screenHeight }}>
      <Image
        source={{ uri: `file://${item}` }}
        style={{
          width: screenWidth,
          height: screenHeight * 0.8,
          resizeMode: 'contain',
        }}
      />
    </View>
  );

  const getItemLayout = (_: any, index: number) => ({
    length: screenWidth,
    offset: screenWidth * index,
    index,
  });

  const handleDelete = async () => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const imageToDelete = images[currentIndex];
            try {
              await FileSystem.deleteAsync(imageToDelete, { idempotent: true });
              setImages(images.filter((_, index) => index !== currentIndex));
              setExpanded(false); // Close the expanded view after deletion
            } catch (error) {
              Alert.alert('Error deleting image', error.message);
            }
          },
        },
      ],
    );
  };

  const handleSaveToGallery = async () => {
    const imageToSave = images[currentIndex];
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(imageToSave);
        Alert.alert('Image Saved', 'The image has been saved to your gallery.');
      } else {
        Alert.alert('Permission Denied', 'You need to grant gallery access to save images.');
      }
    } catch (error) {
      Alert.alert('Error saving image', error.message);
    }
  };

  const getExifData = async (imageUri) => {
    try {
      const asset = await MediaLibrary.createAssetAsync(imageUri);
      const exif = await MediaLibrary.getAssetInfoAsync(asset);
      
      return exif?.location || null; // Location object contains latitude & longitude
    } catch (error) {
      console.error('Error fetching EXIF data:', error);
      return null;
    }
  };

  const openInGoogleMaps = (location) => {
    console.log(location)
    if (!location) {
      Alert.alert('No location data', 'This image does not contain any location data.');
      return;
    }
  
    const { latitude, longitude } = location;
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  
    Linking.openURL(url).catch(err => console.error('Error opening Google Maps:', err));
  };

  return (
    <View style={tw`flex-1 bg-gray-900`}>
      {images.length === 0 ? (
        <View style={tw`flex-1 justify-center items-center`}>
          <Text style={tw`text-white text-center`}>No photos captured yet.</Text>
        </View>
      ) : (
        <>
          {selectMode && (
            <View style={tw`flex-row justify-between p-4 bg-gray-800`}>
              <Pressable style={tw`bg-red-500 px-4 py-2 rounded`} onPress={deleteSelectedImages}>
                <Text style={tw`text-white font-bold`}>Delete</Text>
              </Pressable>
              <Pressable
                style={tw`bg-green-600 px-4 py-2 rounded`}
                onPress={handleBulkSave} // Call bulk save handler
                disabled={selectedImages.length === 0} // Disable if no images are selected
              >
                <Text style={tw`text-white text-base`}>Save</Text>
              </Pressable>
              <Pressable style={tw`bg-blue-600 px-4 py-2 rounded`} onPress={selectAllImages}>
                <Text style={tw`text-white font-bold`}>Select All</Text>
              </Pressable>
              <Pressable style={tw`bg-gray-500 px-4 py-2 rounded`} onPress={cancelSelection}>
                <Text style={tw`text-white font-bold`}>Cancel</Text>
              </Pressable>
            </View>
          )}
          <FlatList
            data={images}
            keyExtractor={(item) => item}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => handleImagePress(index)}
                onLongPress={() => handleLongPress(item)}
                style={{ margin: 5, position: 'relative' }}
              >
                <Image
                  source={{ uri: `file://${item}` }}
                  style={[
                    tw`rounded-lg`,
                    { width: imageSize, height: imageSize}
                  ]}
                  resizeMode="cover"
                />
                {selectedImages.includes(item) && (
                  <View style={tw`absolute top-0 right-0 bottom-0 left-0 rounded-lg`} />
                )}
                <View style={tw`absolute top-1 right-1`}>
                  {selectMode &&(
                    <View
                      style={[
                        tw`w-6 h-6 border-2 border-white rounded-full bg-black bg-opacity-50 justify-center items-center`,
                        selectedImages.includes(item) ? tw`bg-green-500` : null, // Show a green checkbox if selected
                      ]}
                    >
                      {selectedImages.includes(item) && (
                        <Text style={tw`text-white text-xs`}>✓</Text> // Show tick for selected images
                      )}
                    </View>
                  )}
                </View>
              </Pressable>
            )}
            numColumns={numColumns}
          />
        </>
      )}

      <Modal visible={expanded} transparent={true}>
        <View style={tw`flex-1 bg-black`}>
          <FlatList
            data={images}
            keyExtractor={(item) => item}
            renderItem={renderExpandedItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={currentIndex}
            getItemLayout={getItemLayout}
            onMomentumScrollEnd={(event) => {
              const index = Math.floor(event.nativeEvent.contentOffset.x / screenWidth);
              setCurrentIndex(index);
            }}
            onScrollToIndexFailed={(info) => {
              console.warn('Scroll to index failed', info);
            }}
          />

          {/* Bottom Toolbar for Delete and Save to Gallery */}
          <View style={tw`absolute bottom-0 left-0 right-0 bg-gray-800 p-4 flex-row justify-around`}>
            <Pressable onPress={handleDelete} style={tw`bg-red-500 px-4 py-2 rounded`}>
              <Text style={tw`text-white font-bold`}>Delete</Text>
            </Pressable>
            <Pressable onPress={handleSaveToGallery} style={tw`bg-blue-500 px-4 py-2 rounded`}>
              <Text style={tw`text-white font-bold`}>Save to Gallery</Text>
            </Pressable>
            <Pressable
              style={tw`bg-gray-600 px-4 py-2 rounded`}
              onPress={() => openInGoogleMaps(selectedImageLocation)} // Open map with current image location
            >
              <Text style={tw`text-white text-base`}>View in Map</Text>
            </Pressable>
          </View>

          <Pressable
            style={tw`absolute top-10 right-10 bg-gray-700 p-2 rounded-full`}
            onPress={() => setExpanded(false)}
          >
            <Text style={tw`text-white text-xl`}>X</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
