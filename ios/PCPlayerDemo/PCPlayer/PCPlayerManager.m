//
//  PCPlayerManager.m
//  PCPlayerDemo
//
//  Created by CookieJ on 2018/5/30.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "PCPlayerManager.h"
#import "PCPlayer.h"
#import <MediaPlayer/MediaPlayer.h>

@implementation PCPlayerManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [PCPlayer new];
}

RCT_EXPORT_VIEW_PROPERTY(url, NSString)
RCT_EXPORT_VIEW_PROPERTY(width, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(height, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(seek, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(pause, BOOL)
RCT_EXPORT_VIEW_PROPERTY(fullscreen, BOOL)
RCT_EXPORT_VIEW_PROPERTY(volume, CGFloat)
// event
RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPlaying, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPlayComplete, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onLoadStateDidChange, RCTDirectEventBlock)

RCT_EXPORT_METHOD(updateBrightness:(CGFloat)brightness) {
  CGFloat oldBrightness = [UIScreen mainScreen].brightness;
  [[UIScreen mainScreen] setBrightness:oldBrightness - brightness];
}

@end
