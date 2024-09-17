import { useState, useRef, useEffect } from 'react';
import { View, Pressable, Text, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import tw from 'twrnc';
import AntDesign from '@expo/vector-icons/AntDesign';
import { format } from 'date-fns'; // Import date-fns for formatting dates
import * as Location from 'expo-location'; // Import location API

export default function Dashcam() {
  const [started, setStarted] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [sessionFolder, setSessionFolder] = useState<string | null>(null);
  const cameraRef = useRef<CameraView | null>(null);
  const capturing = useRef(false);

  // Request camera permissions
  useEffect(() => {
    const requestPermissions = async () => {
      const { status: cameraStatus } = await requestCameraPermission();
      if (cameraStatus === 'granted') {
        setPermissionGranted(true);
      } else {
        Alert.alert('Camera permission is required to use this feature.');
      }
    };
    requestPermissions();
  }, [requestCameraPermission]);

  // Create a session folder when starting the session
  const createSessionFolder = async () => {
    console.log("Creating session folder...");
  
    // Get current date and time
    const now = new Date();
    // Format the date and time
    const formattedDate = format(now, "yyyy_M_d_HH_mm"); // e.g., 2024_9_16_14_45
  
    // Create session folder path with formatted date
    const sessionPath = `${FileSystem.documentDirectory}dashcam/S_${formattedDate}`;
    
    try {
      await FileSystem.makeDirectoryAsync(sessionPath, { intermediates: true });
      setSessionFolder(sessionPath);
      console.log('Session folder created:', sessionPath);
    } catch (error) {
      console.log('Error creating session folder:', error);
    }
  };

  // Function to take a picture and store it in the session folder
  const takePicture = async () => {
  if (cameraRef.current && permissionGranted && sessionFolder) {
    console.log("Taking picture...");
    const options = { quality: 0.2, skipProcessing: true };
    try {
      const photo = await (cameraRef.current as any).takePictureAsync(options);
      if (photo) {
        // Get the current location
        const location = await Location.getCurrentPositionAsync({});

        // Extract the latitude and longitude
        const latitude = location.coords.latitude.toFixed(6).replace(/\./g, '_');
        const longitude = location.coords.longitude.toFixed(6).replace(/\./g, '_');

        // Use underscores instead of dots in latitude and longitude
        const fileName = `${sessionFolder}/${Date.now()}_lat${latitude}_lng${longitude}.jpg`;

        // Save the image to the session folder
        await FileSystem.moveAsync({
          from: photo.uri,
          to: fileName,
        });
        console.log('Photo saved:', fileName);
      }
    } catch (error) {
      console.log('Error taking picture:', error);
    }
  }
};


  // Effect to manage the photo capturing loop
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (started && !capturing.current) {
      if (!sessionFolder) {
        createSessionFolder(); // Ensure folder is created only once per session
      }
      capturing.current = true;
      intervalId = setInterval(async () => {
        if (started) {
          await takePicture();
        } else {
          if (intervalId) clearInterval(intervalId);
          capturing.current = false;
        }
      }, 2000);
    } else {
      if (intervalId) clearInterval(intervalId);
      capturing.current = false;
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      capturing.current = false;
    };
  }, [started, sessionFolder]);

  // Function to toggle start/stop
  const toggleStartStop = () => {
    setStarted((prevStarted) => !prevStarted);
  };

  return (
    <View style={tw`bg-black h-full flex justify-center items-center`}>
      <View
        style={{
          ...tw`flex-1 w-full`,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
        }}
      >
        {permissionGranted ? (
          <CameraView
            style={tw`flex-1`}
            ref={cameraRef}
          />
        ) : (
          <Text style={tw`text-red-500 absolute top-[30%]`}>Cannot access camera</Text>
        )}
      </View>

      <View style={tw`absolute bottom-20 z-10 flex flex-col items-center`}>
        <Text style={tw`text-white text-2xl mb-4`}>
          Click button to start taking pictures, click again to stop
        </Text>
        <Pressable
          onPress={toggleStartStop}
          style={tw`rounded-full border-[2px] border-solid border-white flex flex-row gap-4 p-3 px-6 items-center bg-${started ? 'white' : 'black'}`}
        >
          <AntDesign name="camera" size={24} color={started ? 'black' : 'white'} />
          <Text style={tw`text-${started ? 'black' : 'white'} text-2xl font-bold`}>
            {started ? 'Stop' : 'Start'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
