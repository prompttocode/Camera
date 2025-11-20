import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import CameraFilter from './src/screens/CameraFilter'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CameraFilter/>
    </GestureHandlerRootView>
  )
}

export default App

const styles = StyleSheet.create({})