import { Text, View, Button, TouchableOpacity, Pressable } from "react-native";
import React, { useState, useRef, useEffect } from 'react';
import tw from "twrnc"
import AntDesign from '@expo/vector-icons/AntDesign';
// import { RNCamera } from 'react-native-camera';

export default function Index() {
  const [started, setStarted] = useState(false)
  // const cameraRef = useRef(null);
  return (
    <View
    style={
      tw`bg-black h-full flex justify-center items-center gap-20`
      }
    >
       {/* <RNCamera
        style={{ flex: 1 }}
        ref= {cameraRef}
        type={RNCamera.Constants.Type.back}
        autoFocus={RNCamera.Constants.AutoFocus.on}
      /> */}
      <Text style={tw`text-white text-2xl text-center`}>Click button to start taking pictures, click again to stop</Text>
      <Pressable 
      onPress={()=>{setStarted(!started)}}
      style={tw`rounded-full border-[2px] border-solid border-white flex flex-row gap-4 p-3 px-6 items-center bg-${started?"white":"black"}`}>
        <AntDesign name="camera" size={24} color={started?"black":"white"} />
        <Text style={tw`text-${started?"black":'white'} text-2xl font-bold`}>{started?"Stop":"Start"}</Text>
      </Pressable>
    </View>
  );
}
