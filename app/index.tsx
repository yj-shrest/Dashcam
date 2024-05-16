import { View, Pressable, Text, PermissionsAndroid, Platform, StyleSheet} from 'react-native';
import {Camera as CameraType, CameraView,useCameraPermissions, CameraCapturedPicture} from "expo-camera"
import React, { useState, useRef, useEffect } from 'react';
import tw from "twrnc"
import AntDesign from '@expo/vector-icons/AntDesign';
import * as Medialibrary from "expo-media-library"
import { BlurView } from '@react-native-community/blur';

export default function Index() {
  const [started, setStarted] = useState(false) 
  
  const [cameraP, setCameraP] = useCameraPermissions()
  const [permission, setPermission] = useState({camera:false, storage: false})
  const [capturedPhoto, setCapturedPhoto] = useState<CameraCapturedPicture | null>(null);
  const cameraRef = useRef(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  let another = false;
  useEffect(()=>{   
  (async ()=>{
       await setCameraP() 
      another = cameraP?.granted===undefined?false: cameraP?.granted
      console.log(another, "there")
      const { status } = await Medialibrary.requestPermissionsAsync();
      console.log(47)
      setPermission({camera: another, storage:status==="granted"});
      }
  
      )()
  },[])
  useEffect(() => {
    (async () => {
      if (capturedPhoto && permission.storage) {

        try {
          const asset = await Medialibrary.createAssetAsync(capturedPhoto?.uri);
          await Medialibrary.createAlbumAsync('Expo', asset, false);
          console.log("done")
        } catch (error) {
          console.log('Error saving photo:', error);
        }
      }
    })();
  }, [capturedPhoto]);
  
  const clickHandler = async () => {
  setStarted(!started);

  if (cameraRef.current && started) {
    // Start the interval to take photos every 3 seconds
    const id = setInterval(async () => {
      const options = {
        autoShutterDuration: 10,
        quality: 0.25,
      };
      const photo = await (cameraRef.current as any).takePictureAsync(options);
      setCapturedPhoto(photo);
    }, 500);

    setIntervalId(id);
  } else if (intervalId) {
    // Clear the interval to stop taking photos
    clearInterval(intervalId);
    setIntervalId(null);
  }
};

  return (
    <View
    style={
      tw`bg-black h-full flex justify-center items-center gap-20`
    }
    >
       <View style={{...tw`flex-1 z-20 bg-black w-full h-0 overflow-hidden`,  backgroundColor: 'rgba(0, 0, 0, 0.9)' }}>
          {permission.camera ? <CameraView style={tw`flex flex-col h-full justify-center flex-1 w-0 h-0`}  facing={"back"} ref= {cameraRef}>
        </CameraView>: <Text style={tw`text-red-500 absolute top-[30%]`}>Cannot access camera</Text>}
        </View>
        
        <View style={tw`flex z-30 flex-col absolute top-[45%] `}>

      <Text style={tw`text-white text-2xl text-center`}>Click button to start taking pictures, click again to stop</Text>
      <Pressable 
      onPress={clickHandler}
      style={tw`rounded-full border-[2px] border-solid border-white flex flex-row gap-4 p-3 px-6 items-center bg-${started?"white":"black"}`}>
        <AntDesign name="camera" size={24} color={started?"black":"white"} />
        <Text style={tw`text-${started?"black":'white'} text-2xl font-bold`}>{started?"Stop":"Start"}</Text>
      </Pressable>
        </View>
    </View>
  );
}


const styles = StyleSheet.create({
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  }
});