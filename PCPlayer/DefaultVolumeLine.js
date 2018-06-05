/**
 * Description : 默认的音量调节组件
 *
 * Author : cookiej
 * Date   : 2018/6/5
 * Time   : 10:55
 */
import React, { PureComponent } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Text
} from 'react-native';

const VolumeLineWidth = 200;
const styles = StyleSheet.create({
  container: {
    width: VolumeLineWidth,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    color: '#fff'
  },
  bgLine: {
    marginTop: 10,
    height: 2,
    width: VolumeLineWidth,
    backgroundColor: '#999'
  },
  volume: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#fff'
  }
});

export default class DefaultVolumeLine extends PureComponent {
  animationValue = new Animated.Value(0);

  updateVolume = volume => {
    const width = VolumeLineWidth * volume;
    this.animationValue.setValue(width);
  };

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>音量调节</Text>
        <View style={styles.bgLine}>
          <Animated.View style={[styles.volume, { width: this.animationValue }]}/>
        </View>
      </View>
    )
  }
}