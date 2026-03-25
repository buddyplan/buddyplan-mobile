import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

const Stub = ({ children }: { children?: React.ReactNode }) =>
  React.createElement(View, { style: styles.container },
    React.createElement(Text, { style: styles.text }, '🗺️ แผนที่ไม่รองรับบน Web'),
    children
  )

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f0',
  },
  text: { color: '#888', fontSize: 14 },
})

export default Stub
export const Marker = Stub
export const PROVIDER_DEFAULT = null
export const PROVIDER_GOOGLE = null
