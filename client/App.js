import React, { Component } from 'react';
import { render } from 'react-dom';
import axios from 'axios';
import cookie from 'js-cookie';
import './App.scss';
import { Container, Row, Navbar } from 'react-bootstrap';

let start = false;
let runInBackground = false;
let startTime;
let currentTime;
let timePassed = 0;
let displayTime = { hour: 0, min: 0, sec: 0, mil: 0 };
let interval;
let timeout;
let user;
let error = false;
let overDay = false;

class App extends Component {
  handleStopwatch = () => {
    if(start === false){
      start = true;
      let date = new Date();
      startTime = date.getTime();
      this.stopwatch();

    } else {
      start = false;
      timePassed = displayTime.min * 60 * 1000 + displayTime.sec * 1000 + displayTime.mil;
      clearInterval(interval);
    }
    this.setState({start});
  }

  handleRestart = () => {
    start = false;
    timePassed = 0;
    clearInterval(interval);
    this.setState({start}, () => {
      displayTime = { hour: 0, min: 0, sec: 0, mil: 0 };
    });
  }

  stopwatch = () => {
    interval = setInterval(() => {
      let date = new Date();
      currentTime = date.getTime();
      let difference = currentTime - startTime + timePassed;
      if(difference > 86400000) overDay = true;
      else overDay = false;
      displayTime.hour = Math.floor(Math.floor(Math.floor(difference / 1000) / 60) / 60);
      displayTime.min = Math.floor(Math.floor((difference - (displayTime.hour * 60 * 60 * 1000)) / 1000) / 60);
      displayTime.sec = Math.floor((difference - (displayTime.hour * 60 * 60 * 1000 + displayTime.min * 60 * 1000)) / 1000);
      displayTime.mil = difference - displayTime.hour * 60 * 60 * 1000 + displayTime.min * 60 * 1000 + displayTime.sec * 1000;
      this.setState({displayTime});
    }, 100)
  }

  handleBackground = () => {
    if(runInBackground === false){
      if(start === true){
        if(error === false){
          let timeToSend = displayTime.min * 60 * 1000 + displayTime.sec * 1000 + displayTime.mil;
          axios.post('--example--https://localhost:5000/send', {
            id: user,
            time: timeToSend,
            insertTime: currentTime
          })
          .then(() => {
            this.showAlert('allFine');
            runInBackground = true;
            this.setState({runInBackground});
          })
          .catch(() => {
            this.showAlert('serverError');
          })
        } else {
          this.showAlert('serverError');
        }
      } else {
        this.showAlert('stopwatchAlert');
      }
    } else {
      axios.post('--example--https://localhost:5000/clear', {
        id: user
      })
      .then(() => {
        this.showAlert('clearStopwatch');
        runInBackground = false;
        this.setState({runInBackground});
      })
      .catch(() => {
        this.showAlert('serverError');
      })
    }
  }

  showAlert = (e) => {
    clearTimeout(timeout);
    document.getElementById('clearStopwatch').style.display = 'none';
    document.getElementById('stopwatchAlert').style.display = 'none';
    document.getElementById('serverError').style.display = 'none';
    document.getElementById('allFine').style.display = 'none';
    document.getElementById(e).style.display = 'block';
    timeout = setTimeout(() => {
      document.getElementById(e).style.display = 'none';
    }, 5000)
  }

  handleAlert = (e) => {
    document.getElementById(e).style.display = 'none';
  }

  cookie = () => {
    user = cookie.get('user');
    if(user === undefined) user = 0;
    axios.post('--example--https://localhost:5000/cookie', {
      id: user
    })
    .then((message) => {
      user = message.data.id;
      cookie.set('user', message.data.id, { expires: 1 });
      if(message.data.time !== undefined && message.data.time !== null){
        timePassed = message.data.time;
        let date = new Date();
        currentTime = date.getTime();
        timePassed += currentTime - message.data.insertTime;
        runInBackground = true;
        this.setState({runInBackground});
        this.handleStopwatch();
      }
    })
    .catch(() => {
      this.showAlert('serverError');
      error = true;
    })
  }

  componentDidMount = () => {
    this.cookie();
  }

  render() { 
    return ( 
      <div className="App">
        <header className="App-header">
          <Navbar className="fixed-top justify-content-center">
            <div id="stopwatchAlert" className="alert alert-warning alert-dismissible" role="alert" style={{display: 'none'}}>
              <strong id="alertText">Stopwatch is not running!</strong>
              <button onClick={() => this.handleAlert('stopwatchAlert')} className="close">
                <span>&times;</span>
              </button>
            </div>
            <div id="serverError" className="alert alert-danger alert-dismissible" role="alert" style={{display: 'none'}}>
              <strong id="alertText">Server error!</strong>
              <button onClick={() => this.handleAlert('serverError')} className="close">
                <span>&times;</span>
              </button>
            </div>
            <div id="allFine" className="alert alert-success alert-dismissible" role="alert" style={{display: 'none'}}>
              <strong id="alertText">You can safely close the tab. The stopwatch is running on the server.</strong>
              <button onClick={() => this.handleAlert('allFine')} className="close">
                <span>&times;</span>
              </button>
            </div>
            <div id="clearStopwatch" className="alert alert-success alert-dismissible" role="alert" style={{display: 'none'}}>
              <strong id="alertText">Server stopwatch cleared.</strong>
              <button onClick={() => this.handleAlert('clearStopwatch')} className="close">
                <span>&times;</span>
              </button>
            </div>
          </Navbar>
          <Container id="container">
            <Row className="justify-content-center">
              <h1 id="time">{overDay === true ? '+24:00:00' : `${displayTime.hour < 10 ? '0' + displayTime.hour : displayTime.hour}:${displayTime.min < 10 ? '0' + displayTime.min : displayTime.min}:${displayTime.sec < 10 ? '0' + displayTime.sec : displayTime.sec}`}</h1>
            </Row>
            <Row className="justify-content-center">
              <button onClick={this.handleStopwatch} id="button" className="btn btn-outline-secondary"><h2 id="text">{start === false ? 'START' : 'PAUSE'}</h2></button>
              <button onClick={this.handleRestart} id="button" className="btn btn-outline-secondary"><h2 id="text">STOP</h2></button>
            </Row>
            <Row className="justify-content-center">
              <button onClick={this.handleBackground} id="button" className="btn btn-outline-danger"><h2 id="closeText">{runInBackground === false ? 'RUN IN BACKGROUND' : 'CLEAR BACKGROUND STOPWATCH'}</h2></button>
            </Row>
          </Container>
        </header>
      </div>
    );
  }
}
 
export default App;
