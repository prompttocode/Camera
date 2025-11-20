import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import {
  Canvas,
  Image as SkiaImage,
  useImage,
  ColorMatrix,
} from '@shopify/react-native-skia';
import effects from '../components/effects';
import Reanimated, { useAnimatedProps, useSharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Slider from '@react-native-community/slider';

Reanimated.addWhitelistedNativeProps({ zoom: true });
const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);


const { width, height } = Dimensions.get('window');

const CameraFilter = () => {
  const [cameraPosition, setCameraPosition] = useState('front'); // Đổi tên cho rõ nghĩadđ
  const device = useCameraDevice(cameraPosition);
  const [hasPermission, setHasPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [flashMode, setFlashMode] = useState('off');
  const [sunMode, setSunMode] = useState(false);
  const camera = useRef(null);
  const [selectedEffect, setSelectedEffect] = useState(effects[0]);
  const [photoPath, setPhotoPath] = useState(null);
  const [brightness, setBrightness] = useState(0);

  const zoom = useSharedValue(device?.neutralZoom || 1);
  const startZoom = useSharedValue(device?.neutralZoom || 1);
  
  // Load ảnh chụp để review
  const image = useImage(photoPath);

  useEffect(() => {
    const requestPermissions = async () => {
      const cameraPermission = await Camera.requestCameraPermission();
      setHasPermission(cameraPermission === 'granted');
      if (cameraPermission !== 'granted') {
        Alert.alert('Lỗi', 'Không có quyền truy cập camera.');
      }
    };
    requestPermissions();
  }, []);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: codes => {
      if (isScanning && codes.length > 0) {
        setIsScanning(false);
        Alert.alert('Scanned', codes[0].value, [
          { text: 'Scan Again', onPress: () => setIsScanning(true) },
        ]);
      }
    },
  });

  const onTakePicturePress = useCallback(async () => {
    if (camera.current == null) return;
    try {
      const photo = await camera.current.takePhoto({
        flash: flashMode,
        enableShutterSound: false,
      });
      setPhotoPath(`file://${photo.path}`);
    } catch (e) {
      console.error(e);
    }
  }, [flashMode]);

  const onPinchGestureEvent = useMemo(() => Gesture.Pinch()
    .onStart(() => {
      startZoom.value = zoom.value;
    })
    .onUpdate((event) => {
      const newZoom = startZoom.value * event.scale;
      const minZoom = device?.minZoom || 1;
      const maxZoom = device?.maxZoom || 1;
      zoom.value = Math.max(minZoom, Math.min(maxZoom, newZoom));
    }), [device, startZoom, zoom]);

  const animatedProps = useAnimatedProps(() => ({
    zoom: zoom.value,
  }), [zoom]);

  // Component hiển thị Overlay giả lập Filter
  const LiveFilterOverlay = useMemo(() => {
    if (!selectedEffect.overlayColor || selectedEffect.overlayColor === 'transparent') {
      return null;
    }
    return (
      <View 
        style={[
          StyleSheet.absoluteFill, 
          { backgroundColor: selectedEffect.overlayColor, zIndex: 1 }
        ]} 
        pointerEvents="none" // Để vẫn bấm được vào camera bên dưới
      />
    );
  }, [selectedEffect]);

  const BrightnessOverlay = useMemo(() => {
    if (brightness === 0) return null;
    const backgroundColor = brightness > 0 ? `rgba(255, 255, 255, ${brightness})` : `rgba(0, 0, 0, ${-brightness})`;
    return (
      <View 
        style={[
          StyleSheet.absoluteFill, 
          { backgroundColor, zIndex: 2 }
        ]} 
        pointerEvents="none"
      />
    );
  }, [brightness]);

  const finalMatrix = useMemo(() => {
    const matrix = [...selectedEffect.matrix];
    matrix[4] += brightness;
    matrix[9] += brightness;
    matrix[14] += brightness;
    return matrix;
  }, [selectedEffect, brightness]);

  if (!device || !hasPermission) return <View style={styles.container} />;

  // --- MÀN HÌNH REVIEW ẢNH (ĐÃ CHỤP) ---
  // Ở đây dùng Skia để áp dụng Matrix Filter thật
  if (photoPath && image) {
    return (
      <View style={styles.container}>
        <Canvas style={StyleSheet.absoluteFill}>
          <SkiaImage
            image={image}
            fit="cover"
            x={0}
            y={0}
            width={width}
            height={height}
          >
            <ColorMatrix matrix={finalMatrix} />
          </SkiaImage>
        </Canvas>
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => setPhotoPath(null)}
          >
            <Text style={styles.textBtn}>Chụp lại</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.textBtn}>Lưu</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // --- MÀN HÌNH CAMERA (LIVE) ---
  return (
    <View style={styles.container}>
      <GestureDetector gesture={onPinchGestureEvent}>
        <ReanimatedCamera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          photo={true}
          codeScanner={codeScanner}
          isActive={true}
          torch={flashMode === 'on' ? 'on' : 'off'}
          animatedProps={animatedProps}
        />
      </GestureDetector>
      
      {/* LỚP PHỦ GIẢ LẬP LIVE FILTER */}
      {LiveFilterOverlay}
      {BrightnessOverlay}

      <View style={styles.uiLayer}>
        {/* Flash Button */}
        <View style={styles.flashBtn}>
        <TouchableOpacity onPress={() => setFlashMode(f => f === 'off' ? 'on' : 'off')}>
           <Image
             source={require('../assets/images/flash.png')}
             resizeMode='contain'
             style={{width: 30, height: 30, tintColor: flashMode === 'on' ? 'yellow' : 'white'}}
           />
        </TouchableOpacity>
        <View style={{height: 20}} />
        <TouchableOpacity onPress={() => setSunMode(s => !s)}>
           <Image
             source={require('../assets/images/sun.png')}
             resizeMode='contain'
             style={{width: 30, height: 30, tintColor: sunMode ? 'yellow' : 'white'}}
           />
        </TouchableOpacity>
        </View>

        {/* Brightness Slider */}
        {sunMode &&(
          <View style={styles.sliderContainer}>
            <TouchableOpacity style={{width:30,height:30}} onPress={()=>{setSunMode(!sunMode)}}>
             <Image style={{width: 15, height: 15,tintColor:'yellow'}} source={require('../assets/images/arrowdown.png')}/> 
            </TouchableOpacity>
          
          
          <Slider
            style={{width: '80%', height: 40}}
            minimumValue={-1}
            maximumValue={1}
            value={brightness}
            onValueChange={setBrightness}
            minimumTrackTintColor="#FFFFFF"
            maximumTrackTintColor="#000000"
          />
        </View>
        )}
        

        {/* Filter List */}
        <View style={styles.filterListContainer}>
          <FlatList
            data={effects}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({item}) => (
              <TouchableOpacity
                style={[
                  styles.filterItem,
                  selectedEffect.name === item.name && styles.filterItemActive
                ]}
                onPress={() => setSelectedEffect(item)}
              >
                <Text style={{
                   color: selectedEffect.name === item.name ? 'yellow' : 'white',
                   fontWeight: 'bold'
                }}>
                  {item.name}
                </Text>
                {/* Hiển thị cảnh báo nếu filter này không có live preview */}
                {item.overlayColor === 'transparent' && item.name !== 'Normal' && (
                   <Text style={{fontSize: 10, color: '#ccc'}}>(No Live)</Text>
                )}
              </TouchableOpacity>
            )}
            keyExtractor={item => item.name}
          />
        </View>

        {/* Controls */}
        <View style={styles.captureButtonContainer}>
          <View style={{width: 50}} /> 
          <TouchableOpacity
            style={styles.buttonTakePicture}
            onPress={onTakePicturePress}
          >
            <View style={styles.innerButton} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.buttonSwitchCamera}
            onPress={() => setCameraPosition(p => p === 'back' ? 'front' : 'back')}
          >
             <Image
               source={require('../assets/images/camera.png')}
               resizeMode='contain'
               style={{width: 30, height: 30, tintColor: 'white'}}
             />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default CameraFilter;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  uiLayer: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 3, // UI phải nằm trên Overlay
  },
  flashBtn: {
    position: 'absolute', top: 50, right: 20,
  },
  sliderContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  sliderLabel: {
    color: 'white',
    marginBottom: 5,
  },
  filterListContainer: {
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.5)',

  },
  filterItem: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: 'yellow'
  },
  captureButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    backgroundColor:'rgba(255, 255, 255, 0.9)',
    paddingTop: 20,
  },
  buttonTakePicture: {
    width: 80, height: 80,
    borderWidth: 5, borderColor: 'black',
    borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
  },
  innerButton: {
    width: 60, height: 60,
    backgroundColor: 'red', borderRadius: 30,
  },
  buttonSwitchCamera: {
    width: 50, height: 50,
    backgroundColor: '#333',
    borderRadius: 25, justifyContent: 'center', alignItems: 'center'
  },
  overlay: {
    position: 'absolute', bottom: 50, width: '100%',
    flexDirection: 'row', justifyContent: 'space-around'
  },
  textBtn: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  backButton: { padding: 20 },
  saveButton: { padding: 20 }
});