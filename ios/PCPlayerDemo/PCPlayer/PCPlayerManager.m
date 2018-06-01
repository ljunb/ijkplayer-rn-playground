//
//  PCPlayerManager.m
//  PCPlayerDemo
//
//  Created by CookieJ on 2018/5/30.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "PCPlayerManager.h"
#import "PCPlayer.h"

@implementation PCPlayerManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [PCPlayer new];
}

RCT_EXPORT_VIEW_PROPERTY(url, NSString)
RCT_EXPORT_VIEW_PROPERTY(width, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(height, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(seek, float)
RCT_EXPORT_VIEW_PROPERTY(pause, BOOL)
RCT_EXPORT_VIEW_PROPERTY(fullscreen, BOOL)
// event
RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPlayComplete, RCTDirectEventBlock)
@end
