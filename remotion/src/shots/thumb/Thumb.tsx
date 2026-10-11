import React from 'react';
import { Freeze } from 'remotion';
import AndroCollide from '../geo/AndroCollide';
import Antarctica from '../geo/Antarctica';
import ApophisPass from '../geo/ApophisPass';
import BHFall from '../geo/BHFall';
import GalaxyHeart from '../geo/GalaxyHeart';
import IssCrash from '../geo/IssCrash';
import IssWhy from '../geo/IssWhy';
import NeutronStar from '../geo/NeutronStar';
import ParkerSun from '../geo/ParkerSun';
import SunHole from '../geo/SunHole';
import VoyagerDay from '../geo/VoyagerDay';
import WormholeTime from '../geo/WormholeTime';
import WormholeTravel from '../geo/WormholeTravel';

// =============================================================================
// Custom thumbnails: one frame of a finished what-if composition, frozen, with
// the same props the video was rendered from (captions blanked by the caller).
// The opening frame already carries the hook title and badge.
// =============================================================================
export const compositionConfig = {
  id: 'Thumb',
  durationInSeconds: 60,          // long enough that <Freeze frame> is never clamped
  fps: 30,
  width: 1080,
  height: 1920,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COMPS: Record<string, React.FC<any>> = {
  AndroCollide, Antarctica, ApophisPass, BHFall, GalaxyHeart, IssCrash, IssWhy, NeutronStar, ParkerSun,
  SunHole, VoyagerDay, WormholeTime, WormholeTravel,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Thumb: React.FC<{ comp?: string; props?: any; frame?: number }> = ({ comp = 'GalaxyHeart', props = {}, frame = 30 }) => {
  const C = COMPS[comp];
  if (!C) return null;
  return <Freeze frame={frame}><C {...props} /></Freeze>;
};

export default Thumb;
