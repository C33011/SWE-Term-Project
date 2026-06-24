from django.shortcuts import render
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Genre, Movie, Showtime
from .serializers import (
    GenreSerializer,
    MovieListSerializer,
    MovieDetailSerializer,
    ShowtimeSerializer,
)


@api_view(["GET"])
def get_genres(request):

    genres = Genre.objects.all().order_by("name")
    serializer = GenreSerializer(genres, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def get_movies(request):

    movies = Movie.objects.all().order_by("movie_id")

    title = request.GET.get("title")
    genre_id = request.GET.get("genre_id")
    status = request.GET.get("status")

    if title:
        movies = movies.filter(title__icontains=title)

    if genre_id:
        movies = movies.filter(genre_id=genre_id)

    if status:
        movies = movies.filter(status=status)

    serializer = MovieListSerializer(movies, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def get_movie_details(request, movie_id):

    movie = get_object_or_404(Movie, movie_id=movie_id)
    serializer = MovieDetailSerializer(movie)
    return Response(serializer.data)


@api_view(["GET"])
def get_showtimes_for_movie(request, movie_id):

    showtimes = Showtime.objects.filter(movie_id=movie_id).order_by("show_datetime")
    serializer = ShowtimeSerializer(showtimes, many=True)
    return Response(serializer.data)