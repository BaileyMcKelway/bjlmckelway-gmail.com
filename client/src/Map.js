/* global window */
import React, { Component } from 'react';
import { StaticMap } from 'react-map-gl';
import { AmbientLight, PointLight, LightingEffect } from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import { PolygonLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { LineLayer } from '@deck.gl/layers';
import GL from '@luma.gl/constants';

// Source data CSV
const DATA_URL = {
  BUILDINGS:
    'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/trips/buildings.json', // eslint-disable-line
  TRIPS: require('./trips-v7.json'), // eslint-disable-line
};

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0,
});

const pointLight = new PointLight({
  color: [255, 255, 255],
  intensity: 7,
  position: [-74.05, 40.7, 8000],
});

const lightingEffect = new LightingEffect({ ambientLight, pointLight });

const material = {
  ambient: 1,
  diffuse: 0.6,
  shininess: 10,
  specularColor: [55, 64, 70],
};

const mapBorders = {
  width: '100vw',
  height: '100vh',
};

const DEFAULT_THEME = {
  buildingColor: [35, 35, 35],
  trailColor0: [0, 200, 235],
  trailColor1: [255, 116, 0],
  material,
  effects: [lightingEffect],
};

const INITIAL_VIEW_STATE = {
  longitude: -74,
  latitude: 40.72,
  zoom: 13,
  pitch: 45,
  bearing: 0,
};

const landCover = [
  [
    [-74.0, 40.7],
    [-74.02, 40.7],
    [-74.02, 40.72],
    [-74.0, 40.72],
  ],
];

// // LINE LAYER ADD-ON
// function getColor(d) {
//   const z = d.start[2];
//   const r = z / 10000;

//   return [255 * (1 - r * 2), 128 * r, 255 * r, 255 * (1 - r)];
// }

// function getSize(type) {
//   if (type.search('major') >= 0) {
//     return 100;
//   }
//   if (type.search('small') >= 0) {
//     return 30;
//   }
//   return 60;
// }

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      time: 0,
    };
  }

  componentDidMount() {
    this._animate();
  }

  componentWillUnmount() {
    if (this._animationFrame) {
      window.cancelAnimationFrame(this._animationFrame);
    }
  }

  _animate() {
    const {
      loopLength = 1800, // unit corresponds to the timestamp in source data
      animationSpeed = 25, // unit time per second
    } = this.props;
    const timestamp = Date.now() / 1000;
    const loopTime = loopLength / animationSpeed;

    this.setState({
      time: ((timestamp % loopTime) / loopTime) * loopLength,
    });
    this._animationFrame = window.requestAnimationFrame(
      this._animate.bind(this)
    );
  }

  _renderLayers() {
    const {
      buildings = DATA_URL.BUILDINGS,
      trips = DATA_URL.TRIPS,
      trailLength = 250,
      theme = DEFAULT_THEME,
      getWidth = 3,
    } = this.props;

    return [
      // new LineLayer({
      //   id: 'trips',
      //   data: trips,
      //   opacity: 0.8,
      //   getSourcePosition: d => d.start,
      //   getTargetPosition: d => d.end,
      //   getColor,
      //   getWidth,
      //   pickable: true,
      // }),
      // This is only needed when using shadow effects
      new PolygonLayer({
        id: 'ground',
        data: landCover,
        getPolygon: f => f,
        stroked: false,
        getFillColor: [0, 0, 0, 0],
      }),
      new TripsLayer({
        id: 'trips',
        data: trips,
        getPath: d => d.path,
        getTimestamps: d => d.timestamps,
        getColor: d => (d.vendor === 0 ? theme.trailColor0 : theme.trailColor1),
        opacity: 0.7,
        widthMinPixels: 10,
        rounded: false,
        trailLength,
        currentTime: this.state.time,

        shadowEnabled: false,
      }),
      new PolygonLayer({
        id: 'buildings',
        data: buildings,
        extruded: true,
        wireframe: false,
        opacity: 0.7,
        getPolygon: f => f.polygon,
        getElevation: f => f.height,
        getFillColor: theme.buildingColor,
        material: theme.material,
      }),
    ];
  }

  render() {
    const {
      viewState,
      mapStyle = 'mapbox://styles/bjlmckelway/ck8df7aqb0q661is3wxma06lt',
      theme = DEFAULT_THEME,
    } = this.props;

    return (
      <DeckGL
        layers={this._renderLayers()}
        effects={theme.effects}
        initialViewState={INITIAL_VIEW_STATE}
        viewState={viewState}
        controller={true}
        style={mapBorders}
        parameters={{
          clearColor: [0.1, 0.2, 0.2, 0.2],
          blendFunc: [GL.SRC_ALPHA, GL.ONE, GL.ONE_MINUS_DST_ALPHA, GL.ONE],
          blendEquation: GL.FUNC_MULTIPLY,
        }}
      >
        <StaticMap
          reuseMaps
          mapStyle={mapStyle}
          preventStyleDiffing={true}
          mapboxApiAccessToken={
            'pk.eyJ1IjoiYmpsbWNrZWx3YXkiLCJhIjoiY2s3dW9ubGU1MDY4MjNkbW4zaHIxcDRheCJ9.c3HiQrOPIJZXgK-sC_qhcg'
          }
        />
      </DeckGL>
    );
  }
}
