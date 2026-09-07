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
    return "Welcome to this best Flask course.This should be an amazing course"  # Simple text response return chestunnam.


@app.route("/index")  # "/index" URL ki inko route add chestunnam.
def index():  # Index route ki matching view function define chestunnam.
    return "Welcome to the index page"  # Index page ki simple text response return chestunnam.


if __name__ == "__main__":  # Ee file ni direct ga run chesinapudu matrame lopala code run avvadaniki guard.
    app.run(debug=True)  # debug=True tho development server ni start chestunnam - auto-reload and detailed error pages kosam.
