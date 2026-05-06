from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0048_remove_project_excerpt'),
    ]

    operations = [
        migrations.CreateModel(
            name='DirectorMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(default='Director', max_length=100)),
                ('title', models.CharField(default='Executive Director', max_length=100)),
                ('photo', models.ImageField(blank=True, null=True, upload_to='director/')),
                ('message', models.TextField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': "Director's Message",
                'verbose_name_plural': "Director's Message",
            },
        ),
    ]
