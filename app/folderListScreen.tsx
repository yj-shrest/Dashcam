import { useState, useEffect } from 'react';
import { View, Text, Pressable, FlatList, Alert, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';
import tw from 'twrnc';
import { useRouter } from 'expo-router';

export default function FolderListScreen() {
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]); // Track selected folders
  const [selectMode, setSelectMode] = useState(false); // Track if we are in select mode
  const router = useRouter();

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const dashcamDir = `${FileSystem.documentDirectory}dashcam`;
        const folderList = await FileSystem.readDirectoryAsync(dashcamDir);
        setFolders(folderList);
      } catch (error) {
        Alert.alert('Error fetching folders', error.message);
      }
    };

    fetchFolders();
  }, []);

  const navigateToGallery = (folder: string) => {
    if (!selectMode) {
      router.push(`/gallery?folder=${encodeURIComponent(folder)}`);
    } else {
      toggleFolderSelection(folder);
    }
  };

  const toggleFolderSelection = (folder: string) => {
    if (selectedFolders.includes(folder)) {
      setSelectedFolders(selectedFolders.filter((f) => f !== folder));
    } else {
      setSelectedFolders([...selectedFolders, folder]);
    }
  };

  const handleLongPress = (folder: string) => {
    setSelectMode(true);
    toggleFolderSelection(folder);
  };

  const deleteSelectedFolders = async () => {
    try {
      for (const folder of selectedFolders) {
        const folderPath = `${FileSystem.documentDirectory}dashcam/${folder}`;
        await FileSystem.deleteAsync(folderPath, { idempotent: true });
      }
      setFolders(folders.filter((folder) => !selectedFolders.includes(folder)));
      setSelectedFolders([]);
      setSelectMode(false);
    } catch (error) {
      Alert.alert('Error deleting folders', error.message);
    }
  };

  const cancelSelection = () => {
    setSelectedFolders([]);
    setSelectMode(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Folders</Text>
      {selectMode && (
        <View style={styles.deleteContainer}>
          <Pressable style={styles.deleteButton} onPress={deleteSelectedFolders}>
            <Text style={styles.deleteButtonText}>Delete Selected</Text>
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={cancelSelection}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      )}
      <FlatList
        data={folders}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.folderCard,
              selectMode && selectedFolders.includes(item) && styles.folderCardSelected,
            ]}
            onPress={() => navigateToGallery(item)}
            onLongPress={() => handleLongPress(item)}
          >
            <View style={styles.folderContent}>
              <Text style={styles.folderName}>{item}</Text>
            </View>
          </Pressable>
        )}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e', // Dark background color
    padding: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 16,
  },
  folderCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  folderCardSelected: {
    backgroundColor: '#2473f2', // Change color when selected
  },
  folderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
  },
  deleteContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#888',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
