# CSE 6242 Team 61 Group Project

Rx Recommender is created to allow user to search medications based on their symptoms. The drug details are presented in a visualized and interactive way to emphasize the important pieces, with the goal of making it easier for users to consume the information.

## Installation

This application is split into a frontend, created using Angular, and a backend, written in Python. Therefore, npm 6.4.0+ and Python 3 is required to run the corresponding component.

#### Install dependency for the backend

Assuming Python 3 is installed, navigate to `CODE/backend/` and run the following command to install the necessary packages:

```
pip install -r requirements.txt
```

If you encounter `Permission denied` error, make sure to run the above command as elevated user.

#### Install dependency for the frontend

Assuming npm 6.4.0+ is installed, navigate to `CODE/frontend/` and run the following command to install the necessary packages:

```
npm install
```

## Execution

Since the application have two parts, you would want to run the backend first then run the frontend.

#### Execute backend

Navigate to `CODE/backend/` and run:

```
python3 api.py
```

When you see the following in the console output, you are ready to run the frontend:

```
* Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)
* Restarting with stat
```

#### Execute frontend

In another terminal, navigate to `CODE/frontend/` and run:

```
npm start
```

After the console output notify you compilation process is completed, the frontend will be available at:

```
http://localhost:4200/
```
