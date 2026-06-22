import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Page } from './entities/page.entity';
import { FormSubmission } from './entities/form-submission.entity';
import { BlockTemplate } from './entities/block-template.entity';
import { PageVersion } from './entities/page-version.entity';
import { PagePV } from './entities/page-pv.entity';
import { CustomComponent } from './entities/custom-component.entity';
import { PagesService } from './pages.service';
import { PagesAssetsService } from './services/pages-assets.service';
import { FormsService } from './services/forms.service';
import { TemplateService } from './services/template.service';
import { VersionService } from './services/version.service';
import { StatsService } from './services/stats.service';
import { ComponentService } from './services/component.service';
import { PagesController } from './pages.controller';
import { PublicPagesController } from './public-pages.controller';
import { PublicFormController } from './controllers/public-form.controller';
import { FormSubmissionsController } from './controllers/form-submissions.controller';
import { TemplateController } from './controllers/template.controller';
import { VersionController } from './controllers/version.controller';
import { StatsController } from './controllers/stats.controller';
import { ComponentController } from './controllers/component.controller';
import { SSOModule } from '../modules/sso/sso.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Page,
      FormSubmission,
      BlockTemplate,
      PageVersion,
      PagePV,
      CustomComponent,
    ]),
    PassportModule,
    SSOModule,
  ],
  controllers: [
    PagesController,
    PublicPagesController,
    PublicFormController,
    FormSubmissionsController,
    TemplateController,
    VersionController,
    StatsController,
    ComponentController,
  ],
  providers: [
    PagesService,
    PagesAssetsService,
    FormsService,
    TemplateService,
    VersionService,
    StatsService,
    ComponentService,
  ],
  exports: [
    PagesService,
    FormsService,
    TemplateService,
    VersionService,
    StatsService,
    ComponentService,
  ],
})
export class PagesModule {}
