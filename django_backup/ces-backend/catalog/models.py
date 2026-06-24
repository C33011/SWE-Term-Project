from django.db import models

class Genre(models.Model):
    genre_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = "genres"
        managed = False

    def __str__(self):
        return self.name


class Movie(models.Model):
    STATUS_CHOICES = [
        ("Currently Running", "Currently Running"),
        ("Coming Soon", "Coming Soon"),
    ]

    movie_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)

    genre = models.ForeignKey(
        Genre,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="genre_id",
    )

    rating = models.CharField(max_length=8, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    poster_url = models.CharField(max_length=500, blank=True, null=True)
    trailer_url = models.CharField(max_length=500, blank=True, null=True)
    director = models.CharField(max_length=255, blank=True, null=True)
    cast_members = models.CharField(max_length=500, blank=True, null=True)

    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        blank=True,
        null=True,
    )

    release_date = models.DateField(blank=True, null=True)
    created_at = models.DateField(blank=True, null=True)

    class Meta:
        db_table = "movies"
        managed = False

    def __str__(self):
        return self.title


class Hall(models.Model):
    hall_id = models.AutoField(primary_key=True)
    hall_name = models.CharField(max_length=255, blank=True, null=True)
    capacity = models.IntegerField(blank=True, null=True)
    total_seats = models.IntegerField(blank=True, null=True)

    class Meta:
        db_table = "halls"
        managed = False

    def __str__(self):
        return self.hall_name or f"Hall {self.hall_id}"


class Seat(models.Model):
    seat_id = models.AutoField(primary_key=True)

    hall = models.ForeignKey(
        Hall,
        on_delete=models.CASCADE,
        db_column="hall_id",
    )

    seat_row = models.CharField(max_length=10, blank=True, null=True)
    seat_number = models.IntegerField(blank=True, null=True)
    status = models.CharField(max_length=50, default="available")

    class Meta:
        db_table = "seats"
        managed = False

    def __str__(self):
        return f"{self.seat_row}{self.seat_number}"


class Showtime(models.Model):
    showtime_id = models.AutoField(primary_key=True)

    movie = models.ForeignKey(
        Movie,
        on_delete=models.CASCADE,
        db_column="movie_id",
    )

    hall = models.ForeignKey(
        Hall,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="hall_id",
    )

    show_datetime = models.DateTimeField()
    available_seats = models.IntegerField(blank=True, null=True)

    class Meta:
        db_table = "showtimes"
        managed = False

    def __str__(self):
        return f"{self.movie.title} - {self.show_datetime}"
