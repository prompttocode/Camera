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
  TouchableWithoutFeedback,
  Animated,
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

// THÊM IMPORT CHO VIDEO PLAYER
import Video from 'react-native-video';

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

  // Focus & Exposure states
  const [focusPoint, setFocusPoint] = useState(null);
  const [showExposureSlider, setShowExposureSlider] = useState(false);
  const [exposure, setExposure] = useState(0);
  const focusBoxOpacity = useRef(new Animated.Value(0)).current;
  const exposureSliderOpacity = useRef(new Animated.Value(0)).current;

  const [savedPhotos, setSavedPhotos] = useState([]);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);

  // THÊM STATE CHO VIDEO PLAYER
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isVideoPlayerVisible, setIsVideoPlayerVisible] = useState(false);

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

  // Handle tap to focus
  const handleCameraTap = useCallback(async (event) => {
    if (camera.current == null) return;

    const { locationX, locationY } = event.nativeEvent;
    const point = { x: locationX, y: locationY };
    
    setFocusPoint(point);
    setShowExposureSlider(true);
    
    // Animate focus box
    Animated.sequence([
      Animated.timing(focusBoxOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(focusBoxOpacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setFocusPoint(null);
    });

    // Show exposure slider
    Animated.timing(exposureSliderOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    try {
      await camera.current.focus(point);
    } catch (error) {
      console.log('Focus error:', error);
    }
  }, []);

  // Hide exposure slider after delay
  useEffect(() => {
    if (showExposureSlider) {
      const timer = setTimeout(() => {
        Animated.timing(exposureSliderOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowExposureSlider(false);
        });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showExposureSlider]);

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

  // Focus Box Component
  const FocusBox = useMemo(() => {
    if (!focusPoint) return null;

    return (
      <Animated.View
        style={[
          styles.focusBox,
          {
            left: focusPoint.x - 50,
            top: focusPoint.y - 50,
            opacity: focusBoxOpacity,
          },
        ]}
        pointerEvents="none"
      />
    );
  }, [focusPoint, focusBoxOpacity]);

  // Exposure Slider Component - TĂNG SIZE VÀ ĐƠN GIẢN HÓA
  const ExposureSlider = useMemo(() => {
  if (!showExposureSlider) return null;

  return (
    <Animated.View
      style={[
        styles.exposureSliderContainer,
        { opacity: exposureSliderOpacity }
      ]}
    >
      
      <Slider
        style={styles.exposureSlider}
        minimumValue={-2}
        maximumValue={2}
        value={exposure}
        onValueChange={(value) => {
          setExposure(value);
        }}
        minimumTrackTintColor="#FFD700"
        maximumTrackTintColor="rgba(255,255,255,0.6)"
        thumbStyle={styles.sliderThumb}
        trackStyle={styles.sliderTrack}
        onSlidingStart={() => console.log('Slider start')} // Debug
        onSlidingComplete={(value) => console.log('Slider complete:', value)} // Debug
      />
      
      
      
    </Animated.View>
  );
}, [showExposureSlider, exposure, exposureSliderOpacity]);

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
        onRecordingFinished: async (video) => {
          console.log('Video recorded:', video.path);
          setIsRecording(false);
          
          // Lưu video vào gallery giống như ảnh
          const videoUri = `file://${video.path}`;
          try {
            const updatedPhotos = [videoUri, ...savedPhotos];
            await AsyncStorage.setItem(
              SAVED_PHOTOS_KEY,
              JSON.stringify(updatedPhotos),
            );
            setSavedPhotos(updatedPhotos);
            Alert.alert('Đã quay xong!', 'Video đã được lưu vào bộ sưu tập.', [
              { text: 'OK' },
              { text: 'Xem Gallery', onPress: () => setIsGalleryVisible(true) }
            ]);
          } catch (e) {
            console.error('Failed to save video.', e);
            Alert.alert('Lỗi', 'Không thể lưu video.');
          }
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
  }, [flashMode, savedPhotos]);
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

  // Thay đổi BrightnessOverlay - CHỈ ÁP DỤNG BRIGHTNESS, KHÔNG ÁP DỤNG EXPOSURE
  const BrightnessOverlay = useMemo(() => {
    // Chỉ dùng brightness, không dùng exposure
    if (brightness === 0) return null;
    const backgroundColor =
      brightness > 0
        ? `rgba(255, 255, 255, ${Math.min(brightness, 0.5)})`
        : `rgba(0, 0, 0, ${Math.min(-brightness, 0.5)})`;
    return (
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor, zIndex: 2 }]}
        pointerEvents="none"
      />
    );
  }, [brightness]); // Bỏ exposure khỏi dependencies

  // Sửa finalMatrix - CHỈ ÁP DỤNG BRIGHTNESS CHO PHOTO PROCESSING
  const finalMatrix = useMemo(() => {
    const matrix = [...selectedEffect.matrix];
    // Chỉ dùng brightness cho matrix, exposure được xử lý bởi camera
    matrix[4] += brightness;
    matrix[9] += brightness;
    matrix[14] += brightness;
    return matrix;
  }, [selectedEffect, brightness]); // Bỏ exposure

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
              renderItem={({ item, index }) => {
                // Kiểm tra xem là video hay ảnh
                const isVideo = item.includes('.mp4') || item.includes('.mov');
                
                return (
                  <View style={styles.galleryItemContainer}>
                    {isVideo ? (
                      <View style={styles.videoContainer}>
                        {/* VIDEO PREVIEW VỚI THUMBNAIL */}
                        <Video
                          source={{ uri: item }}
                          style={styles.videoPreview}
                          resizeMode="contain"
                          paused={true} // Dừng video để làm thumbnail
                          muted={true}
                        />
                        
                        <View style={styles.videoOverlay}>
                          <TouchableOpacity 
                            style={styles.playButton}
                            onPress={() => {
                              setSelectedVideo(item);
                              setIsVideoPlayerVisible(true);
                            }}
                          >
                            <Image source={require('../assets/images/play.png')} style={{ width: 40, height: 40,tintColor:'black' }} />
                          </TouchableOpacity>
                          
                          <Text style={styles.videoFileName}>
                            {item.split('/').pop()}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <Image
                        source={{ uri: item }}
                        style={styles.galleryImage}
                        resizeMode="contain"
                      />
                    )}
                    
                    {/* Indicator cho ảnh/video */}
                    <View style={styles.mediaTypeIndicator}>
                      <Text style={styles.mediaTypeText}>
                        {isVideo ? '📹' : '📷'} {index + 1}/{savedPhotos.length}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
          ) : (
            <View style={styles.emptyGallery}>
              <Text style={styles.emptyGalleryText}>
                Chưa có ảnh hoặc video nào được lưu.
              </Text>
            </View>
          )}
        </View>
      </Modal>

      {/* VIDEO PLAYER MODAL */}
      <Modal
        animationType="fade"
        transparent={false}
        visible={isVideoPlayerVisible}
        onRequestClose={() => setIsVideoPlayerVisible(false)}
      >
        <View style={styles.videoPlayerContainer}>
          <TouchableOpacity
            style={styles.videoPlayerCloseButton}
            onPress={() => {
              setIsVideoPlayerVisible(false);
              setSelectedVideo(null);
            }}
          >
            <Text style={styles.videoPlayerCloseText}>✕</Text>
          </TouchableOpacity>

          {selectedVideo && (
            <Video
              source={{ uri: selectedVideo }}
              style={styles.fullScreenVideo}
              resizeMode="contain"
              controls={true} // Hiện controls play/pause/seek
              paused={false} // Auto play
              repeat={false}
              onError={(error) => {
                console.log('Video error:', error);
                Alert.alert('Lỗi', 'Không thể phát video này.');
              }}
              onEnd={() => {
                console.log('Video ended');
              }}
            />
          )}
          
          <View style={styles.videoPlayerInfo}>
            <Text style={styles.videoPlayerTitle}>
              {selectedVideo ? selectedVideo.split('/').pop() : ''}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Camera View */}
      <View style={StyleSheet.absoluteFill}>
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
            exposure={exposure} // Đây mới là exposure thật từ camera hardware
          />
        </GestureDetector>
      </View>

      {/* Touch Handler - CHỈ Ở VÙNG CAMERA */}
      <TouchableWithoutFeedback onPress={handleCameraTap}>
        <View style={styles.touchableArea} />
      </TouchableWithoutFeedback>

      {LiveFilterOverlay}
      {BrightnessOverlay}
      {GridOverlay}
      {FocusBox}
      {ExposureSlider}

      <View style={styles.uiLayer} pointerEvents="box-none">
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
          <View style={styles.sliderContainer} pointerEvents="box-none">
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

        <View style={styles.filterListContainer} pointerEvents="box-none">
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

        <View style={styles.captureButtonContainer} pointerEvents="box-none">
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
  touchableArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 200, // Để lại 200px cho UI controls ở dưới
    zIndex: 1,
  },
  uiLayer: { 
    flex: 1, 
    justifyContent: 'flex-end', 
    zIndex: 5, // Tăng z-index cao hơn touchableArea
  },
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

  // Grid Styles
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Focus & Exposure Styles
  focusBox: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: 'transparent',
    borderRadius: 4,
    zIndex: 4,
  },
  exposureSliderContainer: {
    position: 'absolute',
    right: 20,
    top: '35%',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 15,
    zIndex: 10, // Tăng z-index cao hơn
    minHeight: 250,
    width: 60, // Tăng width
    justifyContent: 'center',
  },
  exposureMax: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  exposureMin: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
  },
  exposureSlider: {
    width: 200, // Tăng width để dễ kéo
    height: 40, // Tăng height
    transform: [{ rotate: '-90deg' }],
  },
  sliderThumb: {
    backgroundColor: '#FFD700',
    width: 20, // Tăng size thumb
    height: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  sliderTrack: {
    height: 6, // Tăng thickness của track
    borderRadius: 3,
  },
  exposureValue: {
    color: '#FFD700',
    fontSize: 14,
    marginTop: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  // Thêm styles cho video trong gallery
  galleryItemContainer: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
    position: 'relative',
  },
  videoPreview: {
    width: width * 0.8,
    height: height * 0.6,
    backgroundColor: 'black',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  playButtonText: {
    fontSize: 30,
    marginLeft: 5, // Căn chỉnh icon play
  },
  videoFileName: {
    position: 'absolute',
    bottom: 20,
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  
  // VIDEO PLAYER MODAL STYLES
  videoPlayerContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayerCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayerCloseText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  fullScreenVideo: {
    width: width,
    height: height * 0.8,
  },
  videoPlayerInfo: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
  },
  videoPlayerTitle: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
});