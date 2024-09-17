import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import tw from 'twrnc';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={tw`flex-1 justify-center items-center bg-gray-900`}>
      <Text style={tw`text-white text-3xl mb-10`}>Dashcam Options</Text>

      {/* Button to go to Capture Mode */}
      <Pressable
        style={tw`bg-blue-500 p-4 rounded-lg mb-6`}
        onPress={() => router.push('/capture')}
      >
        <Text style={tw`text-white text-xl`}>Capture Mode</Text>
      </Pressable>

      {/* Button to go to Gallery Mode */}
      <Pressable
        style={tw`bg-green-500 p-4 rounded-lg`}
        onPress={() => router.push('/folderListScreen')}
      >
        <Text style={tw`text-white text-xl`}>View Photos</Text>
      </Pressable>
    </View>
  );
}
