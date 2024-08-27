from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import yfinance as yf
from datetime import datetime, timedelta
from model.models import create_model, create_training_data,  preprocess
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust this to your frontend's URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


class PredictionRequest(BaseModel):
    ticker: str
    start: str

@app.post('/predict/')
async def predict(request: PredictionRequest):
    ticker = request.ticker
    start_date = request.start

    try: 
        df = yf.download(ticker, start=start_date, end=datetime.now())
        if df.empty:
            raise HTTPException(status_code=404, detail="Data not found for the specified ticker or date")
        
        scaled_data, scaler = preprocess(df)

        x_train, y_train = create_training_data(scaled_data)
        model = create_model(input_shape=(x_train.shape[1], 1))

        model.fit(x_train, y_train, batch_size=8, epochs = 1, verbose=0)

        predictions = []
        last_60_days = scaled_data[-60:]
        for _ in range(60):
            x_test = np.array([last_60_days])
            pred = model.predict(x_test)
            predictions.append(pred[0][0])
            last_60_days = np.append(last_60_days[1:], pred[0][0]).reshape(-1, 1)

        # Inverse transform predictionn
        response_data = []

        for i in range(60):
            prediction_date = (datetime.now() + timedelta(days=i+1)).strftime('%Y-%m-%d')
            scaled_prediction = scaler.inverse_transform([[predictions[i]]])[0,0]
            response_data.append({"date": prediction_date, "price": scaled_prediction})
        print(response_data)
        return response_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)