from flask import Flask  # Flask class ni import chestunnam; idi manam WSGI application build cheyyadaniki core class.

"""
It creates an instance of the Flask class,
which will be your WSGI (Web Server Gateway Interface) application.
"""
# Pai docstring Flask(__name__) enti chestundo cheptundi - WSGI application object create chestundi.

###WSGI Application
app = Flask(__name__)  # Flask application object create chestunnam; ide manam WSGI application ani antam.


@app.route("/")  # Root URL ("/") ki ee function ni map chestunnam.
def welcome():  # Root route ki matching view function define chestunnam.
    return "Welcome to this Flask course"  # Simple text response return chestunnam.


if __name__ == "__main__":  # Ee file ni direct ga run chesinapudu matrame lopala code run avvadaniki guard.
    app.run()  # Flask built-in development server ni start chestunnam (default: http://127.0.0.1:5000).
