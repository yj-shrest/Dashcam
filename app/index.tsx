import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Pressable, Text } from 'react-native';
import { Camera as CameraType, CameraView, useCameraPermissions, CameraCapturedPicture } from 'expo-camera';
import tw from 'twrnc';
import AntDesign from '@expo/vector-icons/AntDesign';
import * as Medialibrary from 'expo-media-library';

export default function Index() {
  const [started, setStarted] = useState(false);
  const [count, setCount] = useState(0);
  const [cameraP, setCameraP] = useCameraPermissions();
  const [permission, setPermission] = useState({ camera: false, storage: false });
  const [capturedPhoto, setCapturedPhoto] = useState<CameraCapturedPicture | null>(null);
  const [requestId, setRequestId] = useState<Number|null>(null);
  const cameraRef = useRef(null);

  const saveWrapper = useCallback(async () => {
    if (capturedPhoto && permission.storage) {
      try {
        const asset = await Medialibrary.createAssetAsync(capturedPhoto.uri);
        await Medialibrary.createAlbumAsync('Expo', asset, false);
        console.log('done', count);
      } catch (error) {
        console.log('Error saving photo:', error);
      }
    }
  }, [capturedPhoto, permission.storage, count]);

  useEffect(() => {
    saveWrapper();
  }, [capturedPhoto, saveWrapper]);

  useEffect(() => {
    const wrapper = async () => {
      const cameraStatus = await setCameraP();
      const cameraGranted = cameraStatus?.granted || false;

      const { status: storageStatus } = await Medialibrary.requestPermissionsAsync();
      const storageGranted = storageStatus === 'granted';

      setPermission({ camera: cameraGranted, storage: storageGranted });
    };
    wrapper();
  }, []);

  const takePicture = useCallback(async () => {
    if (cameraRef.current) {
      const options = {
        quality: 0.2,
      };
      try {
        const photo = await (cameraRef.current as any).takePictureAsync(options);
        setCapturedPhoto(photo);
        setCount((count) => count + 1);
      } catch (error) {
        console.log('Error taking picture:', error);
      }
    }
  }, [cameraRef]);

  const animate = useCallback(() => {
  if (started) {
    const id = requestAnimationFrame(animate);
    setRequestId(id);
    takePicture();
  }
}, [started, takePicture]);

  useEffect(() => {
    if (started) {
      requestAnimationFrame(animate);
    }
  }, [started, animate]);

  const clickHandler = () => {
    setStarted((prevStarted) => !prevStarted);
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


