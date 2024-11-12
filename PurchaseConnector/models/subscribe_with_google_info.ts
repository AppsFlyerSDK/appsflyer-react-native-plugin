export type SubscribeWithGoogleInfoJson = {
  emailAddress: string;
  familyName: string;
  givenName: string;
  profileId: string;
  profileName: string;
};

export class SubscribeWithGoogleInfo {
  emailAddress: string;
  familyName: string;
  givenName: string;
  profileId: string;
  profileName: string;

  constructor(
    emailAddress: string,
    familyName: string,
    givenName: string,
    profileId: string,
    profileName: string
  ) {
    this.emailAddress = emailAddress;
    this.familyName = familyName;
    this.givenName = givenName;
    this.profileId = profileId;
    this.profileName = profileName;
  }

  static fromJson(json: SubscribeWithGoogleInfoJson): SubscribeWithGoogleInfo {
    return new SubscribeWithGoogleInfo(
      json.emailAddress,
      json.familyName,
      json.givenName,
      json.profileId,
      json.profileName
    );
  }

  //This is primitve types so we can use ...this (spread operator)
  toJson(): SubscribeWithGoogleInfoJson {
    return { ...this };
  }
}
