import numpy as np
import pandas as pd
import tensorflow as tf
import yfinance as yf
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM

def create_model(input_shape):
    model = Sequential()
    model.add(LSTM(128, return_sequences=True, input_shape=input_shape))
    model.add(LSTM(64, return_sequences=False))
    model.add(Dense(25))
    model.add(Dense(1))
    model.compile(optimizer='adam', loss='mean_squared_error')
    return model


def preprocess(df):
    df = df[['Close']]
    dataset = df.values
    scaler = MinMaxScaler(feature_range=(0,1))
    scaled_data = scaler.fit_transform(dataset)
    return scaled_data, scaler

def create_training_data(scaled_data, time_step=60):
    x_train = []
    y_train = []
    for i in range(time_step, len(scaled_data)):
        x_train.append(scaled_data[i-time_step:i, 0])
        y_train.append(scaled_data[i, 0])
    return np.array(x_train), np.array(y_train)