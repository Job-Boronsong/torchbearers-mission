from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0048_remove_project_excerpt'),
    ]

    operations = [
        migrations.AddField(
            model_name='missionvision',
            name='director',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='+',
                to='core.teammember',
                verbose_name='Director (for message section)',
                help_text='Select the team member whose message will be featured',
            ),
        ),
        migrations.AddField(
            model_name='missionvision',
            name='director_message',
            field=models.TextField(blank=True, verbose_name="Director's Message"),
        ),
    ]
