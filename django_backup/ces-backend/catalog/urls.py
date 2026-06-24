from django.urls import path
from . import views


urlpatterns = [
    path("api/genres", views.get_genres, name="get_genres"),
    path("api/movies", views.get_movies, name="get_movies"),
    path("api/movies/<int:movie_id>", views.get_movie_details, name="get_movie_details"),
    path("api/showtimes/<int:movie_id>", views.get_showtimes_for_movie, name="get_showtimes_for_movie"),
]