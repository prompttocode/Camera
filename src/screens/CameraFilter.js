import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  Modal,
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
  ImageFormat,
} from '@shopify/react-native-skia';
import effects from '../components/effects';
import Reanimated, {
  useAnimatedProps,
  useSharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';

Reanimated.addWhitelistedNativeProps({ zoom: true });
const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

const { width, height } = Dimensions.get('window');
const SAVED_PHOTOS_KEY = 'SAVED_PHOTOS_KEY';

const CameraFilter = () => {
  const [cameraPosition, setCameraPosition] = useState('front');
  const device = useCameraDevice(cameraPosition);
  const [gridMode, setGridMode] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [flashMode, setFlashMode] = useState('off');
  const [sunMode, setSunMode] = useState(false);
  const [videoMode, setVideoMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const camera = useRef(null);
  const canvasRef = useRef(null);
  const [selectedEffect, setSelectedEffect] = useState(effects[0]);
  const [photoPath, setPhotoPath] = useState(null);
  const [brightness, setBrightness] = useState(0);

  const [savedPhotos, setSavedPhotos] = useState([]);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);

  const zoom = useSharedValue(device?.neutralZoom || 1);
  const startZoom = useSharedValue(device?.neutralZoom || 1);

  const image = useImage(photoPath);

  // Load saved photos from storage on mount
  useEffect(() => {
    const loadSavedPhotos = async () => {
      try {
        const photosJson = await AsyncStorage.getItem(SAVED_PHOTOS_KEY);
        if (photosJson !== null) {
          setSavedPhotos(JSON.parse(photosJson));
        }
      } catch (e) {
        console.error('Failed to load photos.', e);
      }
    };
    loadSavedPhotos();
  }, []);
  const GridOverlay = useMemo(() => {
    if (!gridMode) return null;

    return (
      <View style={styles.gridContainer} pointerEvents="none">
        {/* Horizontal lines */}
        <View
          style={[styles.gridLine, { top: '33%', width: '100%', height: 1 }]}
        />
        <View
          style={[styles.gridLine, { top: '66%', width: '100%', height: 1 }]}
        />
        {/* Vertical lines */}
        <View
          style={[styles.gridLine, { left: '33%', height: '100%', width: 1 }]}
        />
        <View
          style={[styles.gridLine, { left: '66%', height: '100%', width: 1 }]}
        />
      </View>
    );
  }, [gridMode]);

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

  const handleSave = async () => {
    if (canvasRef.current) {
      const snapshot = await canvasRef.current.makeImageSnapshot();
      if (snapshot) {
        const base64 = snapshot.encodeToBase64(ImageFormat.JPEG, 100);
        const newPhotoUri = `data:image/jpeg;base64,${base64}`;

        try {
          const updatedPhotos = [newPhotoUri, ...savedPhotos];
          await AsyncStorage.setItem(
            SAVED_PHOTOS_KEY,
            JSON.stringify(updatedPhotos),
          );
          setSavedPhotos(updatedPhotos);
          Alert.alert('Đã lưu!', 'Ảnh đã được lưu vào bộ sưu tập.');
          setPhotoPath(null); // Go back to camera
        } catch (e) {
          console.error('Failed to save photo.', e);
          Alert.alert('Lỗi', 'Không thể lưu ảnh.');
        }
      }
    }
  };
  const onStartRecording = useCallback(async () => {
    if (camera.current == null) return;
    try {
      setIsRecording(true);
      camera.current.startRecording({
        flash: flashMode,
        onRecordingFinished: video => {
          console.log('Video recorded:', video.path);
          setIsRecording(false);
          Alert.alert('Đã quay xong!', `Video được lưu tại: ${video.path}`);
        },
        onRecordingError: error => {
          console.error('Recording error:', error);
          setIsRecording(false);
          Alert.alert('Lỗi', 'Không thể quay video.');
        },
      });
    } catch (e) {
      console.error(e);
      setIsRecording(false);
    }
  }, [flashMode]);
  const onStopRecording = useCallback(async () => {
    if (camera.current == null) return;
    try {
      await camera.current.stopRecording();
    } catch (e) {
      console.error(e);
    }
  }, []);

  const onPinchGestureEvent = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          startZoom.value = zoom.value;
        })
        .onUpdate(event => {
          const newZoom = startZoom.value * event.scale;
          const minZoom = device?.minZoom || 1;
          const maxZoom = device?.maxZoom || 1;
          zoom.value = Math.max(minZoom, Math.min(maxZoom, newZoom));
        }),
    [device, startZoom, zoom],
  );

  const animatedProps = useAnimatedProps(
    () => ({
      zoom: zoom.value,
    }),
    [zoom],
  );

  const LiveFilterOverlay = useMemo(() => {
    if (
      !selectedEffect.overlayColor ||
      selectedEffect.overlayColor === 'transparent'
    )
      return null;
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: selectedEffect.overlayColor, zIndex: 1 },
        ]}
        pointerEvents="none"
      />
    );
  }, [selectedEffect]);

  const BrightnessOverlay = useMemo(() => {
    if (brightness === 0) return null;
    const backgroundColor =
      brightness > 0
        ? `rgba(255, 255, 255, ${brightness})`
        : `rgba(0, 0, 0, ${-brightness})`;
    return (
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor, zIndex: 2 }]}
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

  if (photoPath && image) {
    return (
      <View style={styles.container}>
        <Canvas style={StyleSheet.absoluteFill} ref={canvasRef}>
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
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.textBtn}>Lưu</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Gallery Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={isGalleryVisible}
        onRequestClose={() => setIsGalleryVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsGalleryVisible(false)}
          >
            <Text style={styles.closeButtonText}>Đóng</Text>
          </TouchableOpacity>
          {savedPhotos.length > 0 ? (
            <FlatList
              data={savedPhotos}
              horizontal
              pagingEnabled
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={styles.galleryImage}
                  resizeMode="contain"
                />
              )}
            />
          ) : (
            <View style={styles.emptyGallery}>
              <Text style={styles.emptyGalleryText}>
                Chưa có ảnh nào được lưu.
              </Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Camera View */}
      <GestureDetector gesture={onPinchGestureEvent}>
        <ReanimatedCamera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          photo={!videoMode}
          video={videoMode}
          codeScanner={codeScanner}
          isActive={true}
          torch={flashMode === 'on' ? 'on' : 'off'}
          animatedProps={animatedProps}
        />
      </GestureDetector>

      {LiveFilterOverlay}
      {BrightnessOverlay}
      {GridOverlay}

      <View style={styles.uiLayer}>
        <View style={styles.flashBtn}>
          <TouchableOpacity
            onPress={() => setFlashMode(f => (f === 'off' ? 'on' : 'off'))}
          >
            <Image
              source={require('../assets/images/flash.png')}
              resizeMode="contain"
              style={{
                width: 30,
                height: 30,
                tintColor: flashMode === 'on' ? 'yellow' : 'white',
              }}
            />
          </TouchableOpacity>
          <View style={{ height: 20 }} />
          <TouchableOpacity onPress={() => setSunMode(s => !s)}>
            <Image
              source={require('../assets/images/sun.png')}
              resizeMode="contain"
              style={{
                width: 30,
                height: 30,
                tintColor: sunMode ? 'yellow' : 'white',
              }}
            />
          </TouchableOpacity>
          <View style={{ height: 20 }} />
          <TouchableOpacity onPress={() => setVideoMode(v => !v)}>
            <Image
              source={require('../assets/images/video.png')}
              resizeMode="contain"
              style={{
                width: 30,
                height: 30,
                tintColor: videoMode ? 'red' : 'white',
              }}
            />
          </TouchableOpacity>
          <View style={{ height: 20 }} />
          <TouchableOpacity onPress={() => setGridMode(g => !g)}>
            <Image
              source={require('../assets/images/grid.png')}
              resizeMode="contain"
              style={{
                width: 30,
                height: 30,
                tintColor: gridMode ? 'yellow' : 'white',
              }}
            />
          </TouchableOpacity>
        </View>

        {sunMode && (
          <View style={styles.sliderContainer}>
            <TouchableOpacity
              style={{ width: 30, height: 30 }}
              onPress={() => {
                setSunMode(!sunMode);
              }}
            >
              <Image
                style={{ width: 15, height: 15, tintColor: 'yellow' }}
                source={require('../assets/images/arrowdown.png')}
              />
            </TouchableOpacity>
            <Slider
              style={{ width: '80%', height: 40 }}
              minimumValue={-0.2}
              maximumValue={0.5}
              value={brightness}
              onValueChange={setBrightness}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="#000000"
            />
          </View>
        )}

        <View style={styles.filterListContainer}>
          <FlatList
            data={effects}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterItem,
                  selectedEffect.name === item.name && styles.filterItemActive,
                ]}
                onPress={() => setSelectedEffect(item)}
              >
                <Text
                  style={{
                    color:
                      selectedEffect.name === item.name ? 'yellow' : 'white',
                    fontWeight: 'bold',
                  }}
                >
                  {item.name}
                </Text>
                {item.overlayColor === 'transparent' &&
                  item.name !== 'Normal' && (
                    <Text style={{ fontSize: 10, color: '#ccc' }}>
                      (No Live)
                    </Text>
                  )}
              </TouchableOpacity>
            )}
            keyExtractor={item => item.name}
          />
        </View>

        <View style={styles.captureButtonContainer}>
          {/* Gallery Thumbnail */}
          <View
            style={{
              width: 50,
              height: 50,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <TouchableOpacity
              style={styles.galleryThumbnail}
              onPress={() => setIsGalleryVisible(true)}
            >
              {savedPhotos.length > 0 ? (
                <Image
                  source={{ uri: savedPhotos[0] }}
                  style={styles.galleryThumbnailImage}
                />
              ) : (
                <View style={styles.galleryThumbnailEmpty} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.buttonTakePicture,
              isRecording && styles.recordingButton,
            ]}
            onPress={
              videoMode
                ? isRecording
                  ? onStopRecording
                  : onStartRecording
                : onTakePicturePress
            }
          >
            <View
              style={[styles.innerButton, isRecording && styles.recordingInner,{backgroundColor:videoMode?'red':'white'}]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonSwitchCamera}
            onPress={() =>
              setCameraPosition(p => (p === 'back' ? 'front' : 'back'))
            }
          >
            <Image
              source={require('../assets/images/camera.png')}
              resizeMode="contain"
              style={{ width: 30, height: 30, tintColor: 'white' }}
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
  uiLayer: { flex: 1, justifyContent: 'flex-end', zIndex: 3 },
  flashBtn: { position: 'absolute', top: 50, right: 20 },
  sliderContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  filterListContainer: { height: 60, backgroundColor: 'rgba(0,0,0,0.5)' },
  filterItem: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterItemActive: { borderBottomWidth: 2, borderBottomColor: 'yellow' },
  captureButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingTop: 20,
  },
  buttonTakePicture: {
    width: 80,
    height: 80,
    borderWidth: 5,
    borderColor: 'white',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor:'red'
  },
  buttonSwitchCamera: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  textBtn: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  backButton: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
  },
  saveButton: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
  },

  // Gallery Styles
  galleryThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'white',
    overflow: 'hidden',
  },
  galleryThumbnailImage: { width: '100%', height: '100%' },
  galleryThumbnailEmpty: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5,
  },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: 'black', paddingTop: 40 },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: { color: 'white', fontSize: 16 },
  galleryImage: { width: width, height: height },
  emptyGallery: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyGalleryText: { color: 'white', fontSize: 18 },
  recordingButton: {
    borderColor: 'red',
  },
  recordingInner: {
    backgroundColor: 'red',
    borderRadius: 10,
    width: 50,
    height: 50,
  },
});
